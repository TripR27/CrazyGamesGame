import type { PlayerActions } from '@/app/actions';
import { ingredients, shopIngredients, type IngredientShopState } from '@/brewing/ingredients';
import { type RowView, isIngredientListed, toIngredientRowView, isListed, toRoomRowView, toRowView } from '@/economy/shop-model';
import { upgrades } from '@/economy/upgrade-data';
import type { BuyAmount, UpgradeState } from '@/economy/upgrades';
import { t } from '@/i18n/index';
import { recipes } from '@/recipes/recipe-data';
import { ROOMS, roomOffer, type RoomState } from '@/rooms/rooms';
import type { Listener } from '@/shared/state';
import type { TargetRegistry } from '@/shared/targets';
import { createEl } from '@/ui/dom';
import { domBounds } from '@/ui/dom-bounds';
import type { SidePanels } from '@/ui/side-panels';
import './shop.css';

export interface UpgradeRow {
  el: HTMLElement;
  /** The buy button; the tutorial points at it. */
  buy: HTMLButtonElement;
  update(view: RowView): void;
}

/** One line in the shop: name, level, description and a buy button. Only text and flags change after creation. */
export function createUpgradeRow(onBuy: () => void): UpgradeRow {
  const el = createEl('div', 'shop-row');
  const name = createEl('span', 'shop-row-name');
  const level = createEl('span', 'shop-row-level');
  const description = createEl('p', 'shop-row-text');
  const buy = createEl('button', 'shop-buy');
  const head = createEl('div', 'shop-row-head');
  head.append(name, level);
  const info = createEl('div', 'shop-row-info');
  info.append(head, description);
  el.append(info, buy);
  buy.addEventListener('click', onBuy);

  return {
    el,
    buy,
    update(view) {
      name.textContent = view.name;
      level.textContent = view.level;
      description.textContent = view.description;
      buy.textContent = view.buyLabel;
      buy.disabled = !view.canBuy;
      el.classList.toggle('shop-row--maxed', view.maxed);
    },
  };
}

const AMOUNTS: readonly BuyAmount[] = [1, 10, 'max'];

export function createAmountPicker(onPick: (amount: BuyAmount) => void): { el: HTMLElement; select(a: BuyAmount): void } {
  const el = createEl('div', 'shop-amounts');
  const buttons = AMOUNTS.map((amount) => {
    const button = createEl('button', 'shop-amount', t(`shop.amount_${amount}`));
    button.addEventListener('click', () => onPick(amount));
    el.append(button);
    return { amount, button };
  });
  return {
    el,
    select: (picked) => buttons.forEach(({ amount, button }) => button.classList.toggle('shop-amount--on', amount === picked)),
  };
}

export type OneTimeState = IngredientShopState & RoomState;

export interface OneTimeGroupHosts {
  list: HTMLElement;
  root: HTMLElement;
  panel: HTMLElement;
  actions: Pick<PlayerActions, 'buyIngredient' | 'buildRoom'>;
  targets: TargetRegistry;
}

/** The groups at the top of the shop: ingredients, then rooms. Returns the render function for both. */
export function mountOneTimeGroups({ list, root, panel, actions, targets }: OneTimeGroupHosts): (state: OneTimeState) => void {
  const catalog = { ingredients, recipes };
  const renderIngredients = mountOneTimeSection<OneTimeState>({
    list, root, panel, targets,
    headingKey: 'shop.kind_ingredients',
    targetPrefix: 'ingredient-buy',
    entries: shopIngredients(catalog).map((def) => ({
      id: def.id,
      listed: (state) => isIngredientListed(def, state, catalog),
      view: (state) => toIngredientRowView(def, state, catalog),
    })),
    onBuy: actions.buyIngredient,
  });
  const renderRooms = mountOneTimeSection<OneTimeState>({
    list, root, panel, targets,
    headingKey: 'shop.kind_rooms',
    targetPrefix: 'room-buy',
    entries: ROOMS.map((room) => ({
      id: room.id,
      listed: (state) => isListed(roomOffer(state, room)),
      view: (state) => toRoomRowView(room, state),
    })),
    onBuy: actions.buildRoom,
  });
  return (state) => {
    renderIngredients(state);
    renderRooms(state);
  };
}

/** One thing sold once: how to show it right now, and whether it is still in the shop. */
export interface OneTimeEntry<S> {
  id: string;
  listed(state: S): boolean;
  view(state: S): RowView;
}

export interface OneTimeSectionParts<S> {
  list: HTMLElement;
  /** The overlay box and the shop panel, to measure and hide tutorial targets. */
  root: HTMLElement;
  panel: HTMLElement;
  headingKey: string;
  /** Tutorial target of each buy button: `<targetPrefix>:<id>`. */
  targetPrefix: string;
  entries: readonly OneTimeEntry<S>[];
  onBuy(id: string): void;
  targets: TargetRegistry;
}

/**
 * A group of one-time purchases in the shop (ingredients, rooms): one row per entry still for sale. Bought ones
 * leave the shop, and the heading goes when nothing is left. Returns the render function.
 */
export function mountOneTimeSection<S>(parts: OneTimeSectionParts<S>): (state: S) => void {
  const { list, root, panel, entries, onBuy, targets } = parts;
  const heading = createEl('h3', 'shop-kind', t(parts.headingKey));
  list.append(heading);
  const rows = entries.map((entry) => {
    const row = createUpgradeRow(() => onBuy(entry.id));
    list.append(row.el);
    targets.register(`${parts.targetPrefix}:${entry.id}`, () => (panel.hidden || row.el.hidden ? null : domBounds(row.buy, root)));
    return { entry, row };
  });
  return (state) => {
    for (const { entry, row } of rows) {
      row.el.hidden = !entry.listed(state);
      if (!row.el.hidden) row.update(entry.view(state));
    }
    heading.hidden = rows.every(({ row }) => row.el.hidden);
  };
}

export function buildPanel(onPick: (amount: BuyAmount) => void) {
  const panel = createEl('div', 'shop-panel');
  const list = createEl('div', 'shop-list');
  const picker = createAmountPicker(onPick);
  const head = createEl('div', 'shop-head');
  head.append(createEl('h2', 'shop-title', t('shop.title')), picker.el);
  panel.append(head, list);
  return { panel, list, picker };
}

export interface TargetParts {
  /** The element whose bounds are measured against `root` (the panel sits outside the scaled game box). */
  root: HTMLElement;
  panel: HTMLElement;
  rows: Array<{ def: { id: string }; row: UpgradeRow }>;
}

/** Each buy button (while the shop tab is on screen) is something the tutorial can point at. */
export function registerTargets(targets: TargetRegistry, { root, panel, rows }: TargetParts): () => void {
  const removers = rows.map(({ def, row }) =>
    targets.register(`upgrade:${def.id}`, () => (panel.hidden ? null : domBounds(row.buy, root))),
  );
  return () => removers.forEach((remove) => remove());
}

type ShopState = UpgradeState & OneTimeState;

export interface ShopSource {
  getState(): ShopState;
  subscribe(listener: Listener<ShopState>): () => void;
}

export interface ShopHosts {
  /** The scaled overlay box, to measure tutorial targets against. */
  root: HTMLElement;
  panels: SidePanels;
}

/** The Shop tab of the side panel: ingredients and rooms for sale, then one row per upgrade. Returns an unmount function. */
export function mountShop(
  { root, panels }: ShopHosts,
  source: ShopSource,
  actions: Pick<PlayerActions, 'buyUpgrade' | 'buyIngredient' | 'buildRoom' | 'openShop' | 'closeShop'>,
  targets: TargetRegistry,
): () => void {
  let amount: BuyAmount = 1;
  const { panel, list, picker } = buildPanel((picked) => {
    amount = picked;
    render();
  });

  const renderOneTime = mountOneTimeGroups({ list, root, panel, actions, targets });
  let kind = '';
  const rows = upgrades.map((def) => {
    const row = createUpgradeRow(() => actions.buyUpgrade(def.id, amount));
    // A small heading above the first upgrade of each kind (the list is ordered by kind).
    if (def.kind !== kind) list.append(createEl('h3', 'shop-kind', t(`shop.kind_${def.kind}`)));
    kind = def.kind;
    list.append(row.el);
    return { def, row };
  });
  const unregister = registerTargets(targets, { root, panel, rows });

  function render(): void {
    picker.select(amount);
    renderOneTime(source.getState());
    for (const { def, row } of rows) row.update(toRowView(def, source.getState(), amount));
  }
  panels.add({ id: 'shop', labelKey: 'shop.tab', content: panel, onOpen: actions.openShop, onClose: actions.closeShop });
  const unsubscribe = source.subscribe(render);
  render();

  return () => {
    unsubscribe();
    unregister();
    panel.remove();
  };
}
