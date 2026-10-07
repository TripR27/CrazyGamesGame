import type { World } from '@/app/world';
import { createEl, domBounds, type SidePanels } from '@/app/panels-view';
import { DECORATIONS, buyDecorById, decorOffer, type DecorState } from '@/decor/decor';
import { buyIngredientById, ingredients, shopIngredients, type IngredientShopState } from '@/brewing/ingredients';
import { type RowView, isIngredientListed, isUpgradeListed, toDecorRowView, toIngredientRowView, isListed, toRoomRowView, toRowView } from '@/economy/shop-model';
import { upgrades } from '@/economy/upgrade-data';
import { buyUpgradeById, type BuyAmount, type UpgradeState } from '@/economy/upgrades';
import { t } from '@/i18n/translator';
import { recipes } from '@/recipes/recipe-data';
import { ROOMS, buildRoomById, roomOffer, type RoomState } from '@/rooms/rooms';
import type { Listener } from '@/shared/state';
import type { TargetRegistry } from '@/shared/targets';
import './shop.css';

/** Scrolls a buy button into view in the shop list (only as far as needed), so the tutorial arrow is never off-screen. */
const reveal = (button: HTMLElement): void => button.scrollIntoView({ block: 'nearest' });

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

export type OneTimeState = IngredientShopState & RoomState & DecorState;

export interface OneTimeGroupHosts {
  list: HTMLElement;
  root: HTMLElement;
  panel: HTMLElement;
  world: World;
}

/** The groups at the top of the shop: ingredients, rooms, then decorations. Returns the render function for all of them. */
export function mountOneTimeGroups({ list, root, panel, world }: OneTimeGroupHosts): (state: OneTimeState) => void {
  const catalog = { ingredients, recipes };
  const renderIngredients = mountOneTimeSection<OneTimeState>({
    list, root, panel, targets: world.targets,
    headingKey: 'shop.kind_ingredients',
    targetPrefix: 'ingredient-buy',
    entries: shopIngredients(catalog).map((def) => ({
      id: def.id,
      listed: (state) => isIngredientListed(def, state, catalog),
      view: (state) => toIngredientRowView(def, state, catalog),
    })),
    onBuy: (id) => buyIngredientById(world, id),
  });
  const renderRooms = mountOneTimeSection<OneTimeState>({
    list, root, panel, targets: world.targets,
    headingKey: 'shop.kind_rooms',
    targetPrefix: 'room-buy',
    entries: ROOMS.map((room) => ({
      id: room.id,
      listed: (state) => isListed(roomOffer(state, room)),
      view: (state) => toRoomRowView(room, state),
    })),
    onBuy: (id) => buildRoomById(world, id),
  });
  const renderDecor = mountOneTimeSection<OneTimeState>({
    list, root, panel, targets: world.targets,
    headingKey: 'shop.kind_decor',
    targetPrefix: 'decor-buy',
    entries: DECORATIONS.map((def) => ({
      id: def.id,
      listed: (state) => isListed(decorOffer(state, def)),
      view: (state) => toDecorRowView(def, state),
    })),
    onBuy: (id) => buyDecorById(world, id),
  });
  return (state) => {
    renderIngredients(state);
    renderRooms(state);
    renderDecor(state);
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
 * A group of one-time purchases in the shop (ingredients, rooms, decorations): one row per entry still for sale. Bought ones
 * leave the shop, and the heading goes when nothing is left. Returns the render function.
 */
export function mountOneTimeSection<S>(parts: OneTimeSectionParts<S>): (state: S) => void {
  const { list, root, panel, entries, onBuy, targets } = parts;
  const heading = createEl('h3', 'shop-kind', t(parts.headingKey));
  list.append(heading);
  const rows = entries.map((entry) => {
    const row = createUpgradeRow(() => onBuy(entry.id));
    list.append(row.el);
    targets.register(`${parts.targetPrefix}:${entry.id}`, () => (panel.hidden || row.el.hidden ? null : domBounds(row.buy, root)), () => reveal(row.buy));
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
    targets.register(`upgrade:${def.id}`, () => (panel.hidden || row.el.hidden ? null : domBounds(row.buy, root)), () => reveal(row.buy)),
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

/** The Shop tab of the side panel: ingredients, rooms and decorations for sale, then one row per upgrade. Returns an unmount function. */
export function mountShop(
  { root, panels }: ShopHosts,
  world: World,
): () => void {
  const { store: source, targets } = world;
  let amount: BuyAmount = 1;
  const { panel, list, picker } = buildPanel((picked) => {
    amount = picked;
    render();
  });

  const renderOneTime = mountOneTimeGroups({ list, root, panel, world });
  const headings = new Map<string, HTMLElement>();
  const rows = upgrades.map((def) => {
    const row = createUpgradeRow(() => buyUpgradeById(world, def.id, amount));
    // A small heading above the first upgrade of each kind (the list is ordered by kind).
    if (!headings.has(def.kind)) {
      const heading = createEl('h3', 'shop-kind', t(`shop.kind_${def.kind}`));
      headings.set(def.kind, heading);
      list.append(heading);
    }
    list.append(row.el);
    return { def, row };
  });
  const unregister = registerTargets(targets, { root, panel, rows });

  function render(): void {
    const state = source.getState();
    picker.select(amount);
    renderOneTime(state);
    for (const { def, row } of rows) {
      // Locked upgrades (Night Shift before the first staff member) and bought one-time ones are not listed.
      row.el.hidden = !isUpgradeListed(def, state);
      if (!row.el.hidden) row.update(toRowView(def, state, amount));
    }
    for (const [kind, heading] of headings) heading.hidden = rows.every(({ def, row }) => def.kind !== kind || row.el.hidden);
  }
  panels.add({ id: 'shop', labelKey: 'shop.tab', content: panel, onOpen: () => world.bus.emit('shop:opened', {}), onClose: () => world.bus.emit('shop:closed', {}) });
  const unsubscribe = source.subscribe(render);
  render();

  return () => {
    unsubscribe();
    unregister();
    panel.remove();
  };
}
