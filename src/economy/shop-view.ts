import type { World } from '@/app/world';
import { createEl, domBounds, type SidePanels } from '@/app/panels-view';
import { DECORATIONS, buyDecorById, decorOffer } from '@/decor/decor';
import { buyIngredientById, ingredientOffer, ingredients } from '@/brewing/ingredients';
import { type RowView, toDecorRowView, toIngredientRowView, toRoomRowView, toRowView } from '@/economy/shop-model';
import { allSightEntries, clearNew, type SightEntry, type SightKind, type SightTab, shopSightEntries, sightRow, sightStatuses, tabHasNew, teaserRow } from '@/economy/shop-sight';
import { buyUpgradeById, type BuyAmount, quoteFor } from '@/economy/upgrades';
import { t } from '@/i18n/translator';
import { recipes } from '@/recipes/recipe-data';
import type { Ads } from '@/platform/platform';
import { shopAdOffered, topUpForShop } from '@/rewards/rewards';
import { buildRoomById, ROOMS, roomOffer } from '@/rooms/rooms';
import type { Num } from '@/shared/numbers';
import type { OneTimeOffer } from '@/shared/purchases';
import './shop.css';

/** Scrolls a buy button into view in the shop list (only as far as needed), so the tutorial arrow is never off-screen. */
const reveal = (button: HTMLElement): void => button.scrollIntoView({ block: 'nearest' });

export interface UpgradeRow {
  el: HTMLElement;
  /** The buy button; the tutorial points at it. */
  buy: HTMLButtonElement;
  update(view: RowView): void;
}

/**
 * One line in the shop: name, level, description and a buy button, with a "New!" label when it just came in sight. A
 * teaser is grey, with only the name and what it waits for. Only text and flags change after creation.
 */
export function createUpgradeRow(onBuy: () => void, onAd?: () => void): UpgradeRow {
  const el = createEl('div', 'shop-row');
  const ad = createEl('button', 'shop-ad', t('shop.ad_buy'));
  ad.hidden = true;
  if (onAd !== undefined) ad.addEventListener('click', onAd);
  const name = createEl('span', 'shop-row-name');
  const fresh = createEl('span', 'shop-row-new', t('shop.new'));
  const level = createEl('span', 'shop-row-level');
  const description = createEl('p', 'shop-row-text');
  const buy = createEl('button', 'shop-buy');
  const title = createEl('span', 'shop-row-title');
  title.append(name, fresh);
  const head = createEl('div', 'shop-row-head');
  head.append(title, level);
  const info = createEl('div', 'shop-row-info');
  info.append(head, description);
  const buttons = createEl('div', 'shop-row-buttons');
  buttons.append(buy, ad);
  el.append(info, buttons);
  buy.addEventListener('click', onBuy);

  return {
    el,
    buy,
    update(view) {
      name.textContent = view.name;
      fresh.hidden = view.fresh !== true;
      level.textContent = view.level;
      description.textContent = view.description;
      description.hidden = view.description === '';
      buy.textContent = view.buyLabel;
      buy.disabled = !view.canBuy;
      buy.hidden = view.teaser === true;
      ad.hidden = view.adBuy !== true;
      el.classList.toggle('shop-row--maxed', view.maxed);
      el.classList.toggle('shop-row--teaser', view.teaser === true);
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

/** How the Shop tab shows and buys each kind of offer. A new kind of offer is one more entry. */
interface KindRows {
  /** Tutorial target of the buy button: `<target>:<id>`. */
  target: string;
  view(world: World, id: string, amount: BuyAmount): RowView | undefined;
  /** What a click on the buy button costs now, while it is for sale. */
  cost(world: World, id: string, amount: BuyAmount): Num | undefined;
  buy(world: World, id: string, amount: BuyAmount): void;
}

const forSale = (offer: OneTimeOffer | undefined): Num | undefined => (offer?.status === 'forSale' ? offer.cost : undefined);

const catalog = { ingredients, recipes };
const byId = <T extends { id: string }>(list: readonly T[], id: string): T | undefined => list.find((item) => item.id === id);

const KIND_ROWS: Partial<Record<SightKind, KindRows>> = {
  ingredient: {
    target: 'ingredient-buy',
    view: ({ store }, id) => {
      const def = byId(ingredients, id);
      return def && toIngredientRowView(def, store.getState(), catalog);
    },
    cost: ({ store }, id) => {
      const def = byId(ingredients, id);
      return forSale(def && ingredientOffer(store.getState(), def, catalog));
    },
    buy: (world, id) => buyIngredientById(world, id),
  },
  room: {
    target: 'room-buy',
    view: ({ store }, id) => {
      const room = byId(ROOMS, id);
      return room && toRoomRowView(room, store.getState());
    },
    cost: ({ store }, id) => {
      const room = byId(ROOMS, id);
      return forSale(room && roomOffer(store.getState(), room));
    },
    buy: (world, id) => buildRoomById(world, id),
  },
  decor: {
    target: 'decor-buy',
    view: ({ store }, id) => {
      const def = byId(DECORATIONS, id);
      return def && toDecorRowView(def, store.getState());
    },
    cost: ({ store }, id) => {
      const def = byId(DECORATIONS, id);
      return forSale(def && decorOffer(store.getState(), def));
    },
    buy: (world, id) => buyDecorById(world, id),
  },
  upgrade: {
    target: 'upgrade',
    view: ({ store, content }, id, amount) => {
      const def = byId(content.upgrades, id);
      return def && toRowView(def, store.getState(), amount);
    },
    cost: ({ store, content }, id, amount) => {
      const def = byId(content.upgrades, id);
      const deal = def && quoteFor(store.getState(), def, amount);
      return deal !== undefined && deal.count > 0 ? deal.cost : undefined;
    },
    buy: (world, id, amount) => buyUpgradeById(world, id, amount),
  },
};

interface ShopRow {
  entry: SightEntry;
  kind: KindRows;
  row: UpgradeRow;
}

interface ShopListHosts {
  list: HTMLElement;
  /** The overlay box and the shop panel, to measure and hide tutorial targets. */
  root: HTMLElement;
  panel: HTMLElement;
  world: World;
  ads: Pick<Ads, 'rewarded' | 'available'>;
}

/**
 * One row per offer of the Shop tab, under a heading per group (ingredients, rooms, decorations, then the upgrades by
 * kind). Every buy button is a tutorial target. Returns the rows, the headings by group and an unregister function.
 */
function mountRows({ list, root, panel, world, ads }: ShopListHosts, entries: readonly SightEntry[], amount: () => BuyAmount) {
  const headings = new Map<string, HTMLElement>();
  const rows: ShopRow[] = [];
  const removers: Array<() => void> = [];
  for (const entry of entries) {
    const kind = KIND_ROWS[entry.kind];
    if (kind === undefined) continue;
    if (!headings.has(entry.group)) {
      const heading = createEl('h3', 'shop-kind', t(`shop.kind_${entry.group}`));
      headings.set(entry.group, heading);
      list.append(heading);
    }
    // After a rewarded ad the missing gold is added, then the normal purchase runs.
    const withAd = (): void => {
      const cost = kind.cost(world, entry.id, amount());
      if (cost === undefined) return;
      // No ad this time: the card under the HUD says so (no ads at all: the button goes and the card says why).
      const none = (unavailable: boolean): void => void (unavailable || world.bus.emit('ad:none', {}));
      ads.rewarded(() => (topUpForShop(world, cost), kind.buy(world, entry.id, amount())), none);
    };
    const row = createUpgradeRow(() => kind.buy(world, entry.id, amount()), withAd);
    list.append(row.el);
    const bounds = () => (panel.hidden || row.el.hidden ? null : domBounds(row.buy, root));
    removers.push(world.targets.register(`${kind.target}:${entry.id}`, bounds, () => reveal(row.buy)));
    rows.push({ entry, kind, row });
  }
  return { rows, headings, unregister: () => removers.forEach((remove) => remove()) };
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

export interface ShopHosts {
  /** The scaled overlay box, to measure tutorial targets against. */
  root: HTMLElement;
  panels: SidePanels;
  ads: Pick<Ads, 'rewarded' | 'available'>;
}

/**
 * The Shop tab of the side panel: what came in sight in this tavern, with a "New!" label on what just did, and per group
 * one grey teaser of what comes later (economy/shop-sight.ts); sold-out offers leave. Returns an unmount function.
 */
export function mountShop({ root, panels, ads }: ShopHosts, world: World): () => void {
  const { store } = world;
  let amount: BuyAmount = 1;
  const { panel, list, picker } = buildPanel((picked) => {
    amount = picked;
    render();
  });
  const entries = shopSightEntries(world.content);
  const { rows, headings, unregister } = mountRows({ list, root, panel, world, ads }, entries, () => amount);

  function render(): void {
    if (panel.hidden) return;
    const state = store.getState();
    picker.select(amount);
    const statuses = sightStatuses(entries, state);
    for (const { entry, kind, row } of rows) {
      const status = statuses[entries.indexOf(entry)] ?? 'hidden';
      const view = sightRow(entry, status, state, () => kind.view(world, entry.id, amount) ?? teaserRow(entry, state));
      row.el.hidden = view === null;
      if (view === null) continue;
      const cost = status === 'shown' ? kind.cost(world, entry.id, amount) : undefined;
      row.update({ ...view, adBuy: cost !== undefined && ads.available() && shopAdOffered(cost, state.currencies.gold, world.clock.now(), state.rewards.shopAdAt) });
    }
    for (const [group, heading] of headings) heading.hidden = rows.every(({ entry, row }) => entry.group !== group || row.el.hidden);
  }
  panels.add({
    id: 'shop',
    labelKey: 'shop.tab',
    content: panel,
    onOpen: () => {
      render();
      world.bus.emit('shop:opened', {});
    },
    onClose: () => {
      clearNew(world, entries, 'shop');
      world.bus.emit('shop:closed', {});
    },
  });
  const unsubscribe = store.subscribe(render);

  return () => {
    unsubscribe();
    unregister();
    panel.remove();
  };
}

const TABS: readonly SightTab[] = ['shop', 'heroes', 'legacy'];

/**
 * A dot on each tab with something new in sight, and on the Menu button while any has. Each time something new waits
 * while the panel is folded away, the tutorial hears `shop:new`. Returns a stop function.
 */
export function mountNewBadges(panels: SidePanels, world: World): () => void {
  const { store, bus } = world;
  const entries = allSightEntries(world.content);
  const shown = new Map<SightTab, boolean>();
  let waited = false;
  const update = (): void => {
    const state = store.getState();
    let any = false;
    for (const tab of TABS) {
      const on = tabHasNew(entries, state, tab);
      any ||= on;
      if (shown.get(tab) !== on) panels.setBadge(tab, on);
      shown.set(tab, on);
    }
    const waiting = any && !panels.isOpen();
    if (waiting && !waited) bus.emit('shop:new', {});
    waited = waiting;
  };
  update();
  return store.subscribe(update);
}
