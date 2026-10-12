import type { World } from '@/app/world';
import { createEl, domBounds, type SidePanels } from '@/app/panels-view';
import { clearNew, legacySightEntries, sightRow, sightStatuses } from '@/economy/shop-sight';
import { createUpgradeRow } from '@/economy/shop-view';
import { t } from '@/i18n/translator';
import { buyLegacy, LEGACY, type LegacyView, sellTavern, toLegacyView } from '@/prestige/prestige';
import type { GameState } from '@/shared/state';
import './prestige.css';

/** How long the sell button waits for the second click that confirms. */
const CONFIRM_MS = 4000;
/** After selling, the page starts the new tavern after this short pause (the save is written at once). */
const RELOAD_MS = 1500;
/** While the tab is on screen the confirm state and the earnings refresh this often. */
const REFRESH_MS = 500;

function buildPanel() {
  const panel = createEl('div', 'legacy-panel');
  const hops = createEl('p', 'legacy-hops');
  const bonus = createEl('p', 'legacy-text');
  const sellText = createEl('p', 'legacy-text');
  const sell = createEl('button', 'legacy-sell');
  const rows = createEl('div', 'legacy-rows');
  panel.append(createEl('h2', 'legacy-title', t('legacy.title')), hops, bonus, sellText, sell, createEl('h3', 'legacy-subtitle', t('legacy.bonuses_title')), rows);
  return { panel, hops, bonus, sellText, sell, rows };
}

type Panel = ReturnType<typeof buildPanel>;

const entries = legacySightEntries();

/** One shop row per Legacy bonus; each buy button is a tutorial target (`legacy-buy:<id>`). */
function mountRows(ui: Panel, root: HTMLElement, world: World) {
  return LEGACY.map((def) => {
    const row = createUpgradeRow(() => buyLegacy(world, def.id));
    ui.rows.append(row.el);
    const bounds = () => (ui.panel.hidden || row.el.hidden ? null : domBounds(row.buy, root));
    const remove = world.targets.register(`legacy-buy:${def.id}`, bounds, () => row.buy.scrollIntoView({ block: 'nearest' }));
    return { id: def.id, row, remove };
  });
}

/** Bonuses come in sight one by one (with Golden Hop for half the price), with one teaser, and leave at their top level. */
function renderRows(rows: ReturnType<typeof mountRows>, view: LegacyView, state: GameState): void {
  const statuses = sightStatuses(entries, state);
  for (const [i, { id, row }] of rows.entries()) {
    const entry = entries[i];
    const offer = view.rows.find((r) => r.id === id);
    const shown = entry === undefined || offer === undefined ? null : sightRow(entry, statuses[i] ?? 'hidden', state, () => offer.row);
    row.el.hidden = shown === null;
    if (shown !== null) row.update(shown);
  }
}

/**
 * The Legacy tab of the side panel: the Golden Hop, selling the tavern (two clicks, so it never happens by accident) and
 * the bonuses that stay. The sell button and the buy buttons are tutorial targets (`prestige-sell`, `legacy-buy:<id>`).
 * After a sale the page reloads, so the scene and everything at runtime start fresh too. Returns an unmount function.
 */
export function mountLegacy({ root, panels }: { root: HTMLElement; panels: SidePanels }, world: World): () => void {
  const { store, bus, targets, clock } = world;
  const ui = buildPanel();
  let armedUntil = 0;
  let sold = false;
  const rows = mountRows(ui, root, world);
  const stopSellTarget = targets.register('prestige-sell', () => (ui.panel.hidden || ui.sell.disabled ? null : domBounds(ui.sell, root)));

  const render = (): void => {
    if (ui.panel.hidden || sold) return;
    const view = toLegacyView(store.getState());
    ui.hops.textContent = view.hops;
    ui.bonus.textContent = view.bonus;
    ui.sellText.textContent = view.sellText;
    const armed = view.canSell && clock.now() < armedUntil;
    ui.sell.textContent = armed ? t('legacy.sell_confirm') : view.sellLabel;
    ui.sell.disabled = !view.canSell;
    ui.sell.classList.toggle('legacy-sell--armed', armed);
    renderRows(rows, view, store.getState());
  };
  ui.sell.addEventListener('click', () => {
    if (clock.now() < armedUntil) sellTavern(world);
    else armedUntil = clock.now() + CONFIRM_MS;
    render();
  });
  const stopSold = bus.on('prestige:done', () => {
    sold = true;
    ui.sellText.textContent = t('legacy.sold');
    ui.sell.disabled = true;
    window.setTimeout(() => window.location.reload(), RELOAD_MS);
  });

  let timer: number | undefined;
  panels.add({
    id: 'legacy',
    labelKey: 'legacy.tab',
    content: ui.panel,
    onOpen: () => {
      render();
      timer = window.setInterval(render, REFRESH_MS);
      bus.emit('legacy:opened', {});
    },
    onClose: () => {
      window.clearInterval(timer);
      clearNew(world, entries, 'legacy');
      bus.emit('legacy:closed', {});
    },
  });
  const unsubscribe = store.subscribe(render);
  return () => {
    [unsubscribe, stopSold, stopSellTarget, ...rows.map((r) => r.remove)].forEach((stop) => stop());
    window.clearInterval(timer);
    ui.panel.remove();
  };
}
