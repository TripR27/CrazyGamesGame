import type { World } from '@/app/world';
import { createEl, domBounds, type SidePanels } from '@/app/panels-view';
import { createUpgradeRow } from '@/economy/shop-view';
import { buyQuartermaster, setHeroAuto } from '@/heroes/auto';
import { GEAR, GEAR_SLOTS, type GearSlot, buyGearById, equipGear } from '@/heroes/gear';
import { sendHero } from '@/heroes/expedition';
import { HERO_CLASSES, hireHeroById } from '@/heroes/heroes';
import type { RowView } from '@/economy/shop-model';
import { type HeroCardView, type SlotView, toHeroesView } from '@/heroes/heroes-model';
import { t } from '@/i18n/translator';
import './heroes.css';

/** While the tab is on screen the countdowns tick; this often is enough for a "1:05" clock. */
const REFRESH_MS = 250;

const setText = (el: HTMLElement, text: string): void => {
  if (el.textContent !== text) el.textContent = text;
};

interface SlotRow {
  el: HTMLElement;
  label: HTMLElement;
  select: HTMLSelectElement;
  /** The options shown now, to rebuild them only when they change. */
  shown: string;
}

/** One gear slot on a card: its name and a list of the pieces that fit (or nothing). */
function createSlotRow(onPick: (gearId: string | null) => void): SlotRow {
  const el = createEl('label', 'hero-slot');
  const label = createEl('span', 'hero-slot-name');
  const select = createEl('select', 'hero-slot-select');
  el.append(label, select);
  select.addEventListener('change', () => onPick(select.value === '' ? null : select.value));
  return { el, label, select, shown: '' };
}

function updateSlotRow(row: SlotRow, view: SlotView): void {
  setText(row.label, view.label);
  const key = view.options.map((o) => `${o.id}:${o.label}`).join('|');
  if (key !== row.shown) {
    row.shown = key;
    row.select.replaceChildren(...view.options.map((o) => Object.assign(document.createElement('option'), { value: o.id, textContent: o.label })));
  }
  // Leave a list the player has open alone; it shows the new state once it closes.
  if (document.activeElement !== row.select) row.select.value = view.selected;
  row.select.disabled = !view.enabled;
}

interface Card {
  el: HTMLElement;
  button: HTMLButtonElement;
  /** The Auto switch, shown with the Quartermaster. */
  auto: HTMLButtonElement;
  autoOn: boolean;
  kind: HeroCardView['action']['kind'];
  slots: Record<GearSlot, SlotRow>;
  update(view: HeroCardView): void;
}

/** One hero's card: name, tagline, level with an XP bar, where they are, gear, a button and Auto. Only text and flags change. */
function createCard(onAction: (card: Card) => void, onGear: (slot: GearSlot, gearId: string | null) => void, onAuto: (card: Card) => void): Card {
  const el = createEl('div', 'hero-card');
  const title = createEl('strong', 'hero-title');
  const level = createEl('span', 'hero-level');
  const head = createEl('div', 'hero-head');
  head.append(title, level);
  const tagline = createEl('p', 'hero-tagline');
  const bar = createEl('div', 'hero-xp-bar');
  const fill = createEl('div', 'hero-xp-fill');
  const xp = createEl('span', 'hero-xp');
  bar.append(fill, xp);
  const status = createEl('p', 'hero-status');
  const bag = createEl('p', 'hero-bag');
  const button = createEl('button', 'hero-button');
  const gear = createEl('div', 'hero-gear');
  const slots = Object.fromEntries(GEAR_SLOTS.map((slot) => [slot, createSlotRow((id) => onGear(slot, id))])) as Record<GearSlot, SlotRow>;
  gear.append(...GEAR_SLOTS.map((slot) => slots[slot].el));
  const auto = createEl('button', 'hero-auto');
  el.append(head, tagline, bar, status, bag, gear, button, auto);
  const card: Card = {
    el,
    button,
    auto,
    autoOn: false,
    kind: 'none',
    slots,
    update(view) {
      gear.hidden = view.slots.length === 0;
      for (const slot of view.slots) updateSlotRow(slots[slot.slot], slot);
      card.kind = view.action.kind;
      setText(title, view.title);
      setText(level, view.level);
      setText(tagline, view.tagline);
      setText(xp, view.xp);
      bar.hidden = view.level === '';
      fill.style.width = `${Math.round(view.xpFraction * 100)}%`;
      setText(status, view.status);
      setText(bag, view.bag);
      setText(button, view.action.label);
      button.disabled = !view.action.enabled;
      auto.hidden = view.auto === null;
      card.autoOn = view.auto?.on ?? false;
      auto.classList.toggle('hero-auto--on', card.autoOn);
      setText(auto, view.auto?.label ?? '');
    },
  };
  button.addEventListener('click', () => onAction(card));
  auto.addEventListener('click', () => onAuto(card));
  return card;
}

function buildPanel() {
  const panel = createEl('div', 'heroes-panel');
  const noGuild = createEl('p', 'heroes-no-guild');
  const stockTitle = createEl('h3', 'heroes-stock-title');
  const stock = createEl('ul', 'heroes-stock');
  const help = createEl('p', 'heroes-help');
  const list = createEl('div', 'heroes-list');
  const shopTitle = createEl('h3', 'heroes-stock-title', t('gear.shop_title'));
  const shop = createEl('div', 'heroes-gear-shop');
  const quartermaster = createEl('div', 'heroes-gear-shop');
  panel.append(createEl('h2', 'heroes-title', t('heroes.title')), noGuild, stockTitle, stock, help, quartermaster, list, shopTitle, shop);
  return { panel, noGuild, stockTitle, stock, help, quartermaster, list, shopTitle, shop };
}

type Panel = ReturnType<typeof buildPanel>;

/** The gear for sale, below the heroes: one shop row per piece, each buy button a tutorial target (`gear-buy:<id>`). */
function mountGearShop({ root, panel, shop }: Panel & { root: HTMLElement }, world: World) {
  return GEAR.filter((def) => def.buy !== undefined).map((def) => {
    const row = createUpgradeRow(() => buyGearById(world, def.id));
    shop.append(row.el);
    const bounds = () => (panel.hidden || row.el.hidden ? null : domBounds(row.buy, root));
    const remove = world.targets.register(`gear-buy:${def.id}`, bounds, () => row.buy.scrollIntoView({ block: 'nearest' }));
    return { id: def.id, row, remove };
  });
}

/** A shop row in the tab: shown with its offer, hidden without one. */
function showRow(row: ReturnType<typeof createUpgradeRow>, view: RowView | null): void {
  row.el.hidden = view === null;
  if (view !== null) row.update(view);
}

/** The Quartermaster for sale, above the heroes; its buy button is the tutorial target `quartermaster-buy`. */
function mountQuartermaster({ root, panel, quartermaster }: Panel & { root: HTMLElement }, world: World) {
  const row = createUpgradeRow(() => buyQuartermaster(world));
  quartermaster.append(row.el);
  const bounds = () => (panel.hidden || row.el.hidden ? null : domBounds(row.buy, root));
  const remove = world.targets.register('quartermaster-buy', bounds, () => row.buy.scrollIntoView({ block: 'nearest' }));
  return { row, remove };
}

/** A card per hero class, each with its buttons and gear lists registered as tutorial targets. */
function mountCards({ root, panel, list }: Panel & { root: HTMLElement }, world: World) {
  const { targets } = world;
  return HERO_CLASSES.map((def) => {
    const card = createCard(
      (c) => (c.kind === 'hire' ? hireHeroById(world, def.id) : sendHero(world, def.id)),
      (slot, gearId) => equipGear(world, def.id, slot, gearId),
      (c) => setHeroAuto(world, def.id, !c.autoOn),
    );
    list.append(card.el);
    const showing = (kind: string) => () => (panel.hidden || card.el.hidden || card.kind !== kind ? null : domBounds(card.button, root));
    const reveal = (): void => card.button.scrollIntoView({ block: 'nearest' });
    const autoBounds = () => (panel.hidden || card.el.hidden || card.auto.hidden ? null : domBounds(card.auto, root));
    const removers = [
      targets.register(`hero-send:${def.id}`, showing('send'), reveal),
      targets.register(`hero-hire:${def.id}`, showing('hire'), reveal),
      targets.register(`hero-auto:${def.id}`, autoBounds, () => card.auto.scrollIntoView({ block: 'nearest' })),
    ];
    for (const slot of GEAR_SLOTS) {
      const el = card.slots[slot].select;
      const bounds = () => (panel.hidden || card.el.hidden ? null : domBounds(el, root));
      removers.push(targets.register(`gear-slot:${def.id}:${slot}`, bounds, () => el.scrollIntoView({ block: 'nearest' })));
    }
    return { def, card, removers };
  });
}

/**
 * The Heroes tab of the side panel: the dungeon loot held, the Quartermaster while for sale, a card per hero (send them to
 * the swamp or hire them, their gear and Auto), then the gear for sale. The buttons and gear lists are tutorial targets
 * (`hero-send:<id>`, `hero-hire:<id>`, `hero-auto:<id>`, `gear-slot:<hero>:<slot>`, `quartermaster-buy`). Returns an
 * unmount function.
 */
export function mountHeroes({ root, panels }: { root: HTMLElement; panels: SidePanels }, world: World): () => void {
  const { store, clock } = world;
  const parts = buildPanel();
  const { panel, noGuild, stockTitle, stock, help, shopTitle } = parts;
  const cards = mountCards({ ...parts, root }, world);
  const gearRows = mountGearShop({ ...parts, root }, world);
  const { row: quartermaster, remove: stopQmTarget } = mountQuartermaster({ ...parts, root }, world);

  let shownStock = '';
  const render = (): void => {
    if (panel.hidden) return;
    const view = toHeroesView(store.getState(), clock.now());
    noGuild.hidden = view.noGuild === null;
    setText(noGuild, view.noGuild ?? '');
    setText(stockTitle, view.stockTitle);
    stockTitle.hidden = view.stock.length === 0;
    setText(help, view.drinksHelp);
    help.hidden = view.drinksHelp === '';
    if (view.stock.join('|') !== shownStock) {
      shownStock = view.stock.join('|');
      stock.replaceChildren(...view.stock.map((line) => createEl('li', 'heroes-stock-item', line)));
    }
    for (const { def, card } of cards) {
      const cardView = view.cards.find((c) => c.id === def.id);
      card.el.hidden = cardView === undefined;
      if (cardView !== undefined) card.update(cardView);
    }
    for (const { id, row } of gearRows) showRow(row, view.gearShop.find((g) => g.id === id)?.row ?? null);
    shopTitle.hidden = view.gearShop.length === 0;
    showRow(quartermaster, view.quartermaster);
  };

  let timer: number | undefined;
  panels.add({
    id: 'heroes',
    labelKey: 'heroes.tab',
    content: panel,
    onOpen: () => {
      render();
      timer = window.setInterval(render, REFRESH_MS);
      world.bus.emit('heroes:opened', {});
    },
    onClose: () => {
      window.clearInterval(timer);
      world.bus.emit('heroes:closed', {});
    },
  });
  const unsubscribe = store.subscribe(render);
  return () => {
    unsubscribe();
    window.clearInterval(timer);
    cards.forEach(({ removers }) => removers.forEach((remove) => remove()));
    gearRows.forEach(({ remove }) => remove());
    stopQmTarget();
    panel.remove();
  };
}
