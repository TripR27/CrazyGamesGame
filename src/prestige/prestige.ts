import type { World } from '@/app/world';
import type { RowView } from '@/economy/shop-model';
import type { UpgradeEffect } from '@/economy/upgrade-data';
import { t } from '@/i18n/translator';
import { levelFor, REPUTATION_LEVELS } from '@/reputation/reputation';
import { textKey } from '@/shared/content';
import type { EventBus, GameEvents } from '@/shared/events';
import { formatNumber, num, type Num } from '@/shared/numbers';
import { watchBuyable, type WatchSource } from '@/shared/purchases';
import { createInitialState, type GameState, type PrestigeState } from '@/shared/state';

/** Placeholder numbers, tuned with `npm run simulate`. */
export const PRESTIGE = {
  /** The tavern can be sold from this reputation level on (Legendary Hall). */
  level: 6,
  /** Golden Hop for selling: the square root of the gold earned this run, in units of `hopGold`. */
  hopGold: 250_000,
  /** Selling needs at least this many Golden Hop (selling for less is never worth a fresh start). */
  minHops: 4,
  /** Every Golden Hop ever earned adds this share to the drink price. */
  pricePerHop: 0.1,
} as const;

/**
 * A permanent bonus bought with Golden Hop. Level n+1 costs `baseCost * (n+1)`. `effects` work like upgrades (through
 * `getMultipliers`); `startGold` is gold every new tavern starts with, per level. Texts: `legacy.<id>.name`, `.description`.
 */
export interface LegacyDef {
  id: string;
  baseCost: number;
  maxLevel: number;
  effects: readonly UpgradeEffect[];
  startGold?: number;
}

/** Placeholder numbers. A new bonus is one more entry. */
export const LEGACY: readonly LegacyDef[] = [
  { id: 'copper_kettle', baseCost: 1, maxLevel: 5, effects: [{ stat: 'brewSpeed', mode: 'multiply', perLevel: 0.1 }] },
  { id: 'seed_money', baseCost: 1, maxLevel: 5, effects: [], startGold: 1000 },
  {
    id: 'staff_handbook',
    baseCost: 2,
    maxLevel: 5,
    effects: [
      { stat: 'autoBrew', mode: 'multiply', perLevel: 0.15 },
      { stat: 'autoServe', mode: 'multiply', perLevel: 0.15 },
    ],
  },
  { id: 'night_watch', baseCost: 2, maxLevel: 4, effects: [{ stat: 'offlineHours', mode: 'add', perLevel: 1 }] },
];

const HOP_BONUS: UpgradeEffect = { stat: 'sellPrice', mode: 'add', perLevel: PRESTIGE.pricePerHop };

type Legacy = Pick<PrestigeState, 'totalHops' | 'legacy'>;

const legacyLevel = (prestige: Pick<PrestigeState, 'legacy'>, def: LegacyDef): number => Math.min(def.maxLevel, prestige.legacy[def.id] ?? 0);

/** What selling taverns adds to the stats: the Golden Hop ever earned (pricier drinks) and the Legacy bonuses bought. */
export function prestigeBonuses(prestige: Legacy | undefined): { effect: UpgradeEffect; times: number }[] {
  if (prestige === undefined) return [];
  const bonuses = [{ effect: HOP_BONUS, times: prestige.totalHops }];
  for (const def of LEGACY) for (const effect of def.effects) bonuses.push({ effect, times: legacyLevel(prestige, def) });
  return bonuses;
}

/** The Golden Hop selling would bring for this much gold earned in a run. */
export const hopsFor = (runEarned: Num): number =>
  Math.floor(Math.sqrt(Math.max(0, runEarned.div(PRESTIGE.hopGold).toNumber())));

type SellState = Pick<GameState, 'reputation' | 'prestige'>;

/** The tavern can be sold: Legendary Hall, and enough gold earned this run for `minHops`. */
export const canSell = (state: SellState): boolean => levelFor(state.reputation) >= PRESTIGE.level && hopsFor(state.prestige.runEarned) >= PRESTIGE.minHops;

/** Gold every new tavern starts with. */
export const startGold = (prestige: Pick<PrestigeState, 'legacy'>): number =>
  LEGACY.reduce((sum, def) => sum + (def.startGold ?? 0) * legacyLevel(prestige, def), 0);

/**
 * Sell the tavern: Golden Hop for the gold earned this run, and a fresh start. What stays: the recipes found, the
 * tutorial, the Golden Hop and the Legacy (and the date the game began). Everything else starts over, with the start
 * gold of the Legacy. Does nothing when the tavern cannot be sold yet.
 */
export function sellTavern({ store, bus, clock }: Pick<World, 'store' | 'bus' | 'clock'>): void {
  const before = store.getState();
  if (!canSell(before)) return;
  const hops = hopsFor(before.prestige.runEarned);
  const fresh = createInitialState(clock.now());
  const { recipesDiscovered, tutorial, meta, prestige } = before;
  store.update((s) => {
    Object.assign(s, fresh, { recipesDiscovered, tutorial });
    s.meta.createdAt = meta.createdAt;
    s.prestige = { ...prestige, hops: prestige.hops + hops, totalHops: prestige.totalHops + hops, runs: prestige.runs + 1, runEarned: num(0) };
    s.currencies.gold = num(startGold(prestige));
  });
  bus.emit('prestige:done', { hops });
  bus.emit('saveRequested', {});
}

/** What the next level of a Legacy bonus costs, in Golden Hop (undefined at the top level). */
export function legacyCost(prestige: Pick<PrestigeState, 'legacy'>, def: LegacyDef): number | undefined {
  const level = legacyLevel(prestige, def);
  return level >= def.maxLevel ? undefined : def.baseCost * (level + 1);
}

/** Buy the next level of a Legacy bonus with Golden Hop; does nothing at the top level or without enough Hop. */
export function buyLegacy({ store, bus }: Pick<World, 'store' | 'bus'>, id: string): void {
  const def = LEGACY.find((d) => d.id === id);
  const prestige = store.getState().prestige;
  const cost = def === undefined ? undefined : legacyCost(prestige, def);
  if (def === undefined || cost === undefined || prestige.hops < cost) return;
  store.update((s) => {
    s.prestige.hops -= cost;
    s.prestige.legacy[def.id] = legacyLevel(s.prestige, def) + 1;
  });
  bus.emit('legacy:bought', { id: def.id });
  bus.emit('saveRequested', {});
}

/** The first Legacy bonus the player can pay for now, if any. */
export const firstAffordableLegacy = (prestige: PrestigeState): LegacyDef | undefined =>
  LEGACY.find((def) => {
    const cost = legacyCost(prestige, def);
    return cost !== undefined && prestige.hops >= cost;
  });

/**
 * Counts the gold earned in this tavern (every serve, and the staff's pay while away) and announces when the tavern can
 * be sold (`prestige:available`). One line in createWorld.
 */
export function startPrestige({ store, bus }: Pick<World, 'store' | 'bus'>): void {
  const earn = (gold: Num): void => store.update((s) => void (s.prestige.runEarned = s.prestige.runEarned.add(gold)));
  bus.on('customer:served', ({ gold, tip }) => earn(gold.add(tip)));
  bus.on('offline:paid', ({ gold }) => earn(gold));
  watchSale(store, bus);
}

function watchSale(source: WatchSource<SellState>, bus: EventBus<GameEvents>): () => void {
  return watchBuyable(source, bus, canSell, 'prestige:available');
}

/** The Legacy tab as plain strings: the Golden Hop, selling the tavern, and the bonuses for sale. */
export interface LegacyView {
  hops: string;
  bonus: string;
  /** What selling brings now, or what it still needs. */
  sellText: string;
  sellLabel: string;
  canSell: boolean;
  rows: { id: string; row: RowView }[];
}

export function toLegacyView(state: SellState): LegacyView {
  const { prestige } = state;
  const hops = hopsFor(prestige.runEarned);
  const levelName = t(textKey('reputation', REPUTATION_LEVELS[PRESTIGE.level - 1]?.id ?? '', 'name'));
  const sellable = canSell(state);
  const sellText = sellable
    ? t('legacy.sell_ready', { hops })
    : levelFor(state.reputation) < PRESTIGE.level
      ? t('legacy.sell_level', { level: levelName })
      : t('legacy.sell_gold', { min: PRESTIGE.minHops, earned: formatNumber(prestige.runEarned), hops });
  const rows = LEGACY.map((def) => {
    const level = legacyLevel(prestige, def);
    const cost = legacyCost(prestige, def);
    const row: RowView = {
      name: t(textKey('legacy', def.id, 'name')),
      description: t(textKey('legacy', def.id, 'description')),
      level: t('legacy.level', { level, max: def.maxLevel }),
      buyLabel: cost === undefined ? t('legacy.maxed') : t('legacy.buy', { cost }),
      canBuy: cost !== undefined && prestige.hops >= cost,
      maxed: cost === undefined,
    };
    return { id: def.id, row };
  });
  return {
    hops: t('legacy.hops', { hops: prestige.hops }),
    bonus: t('legacy.bonus', { n: Math.round(prestige.totalHops * PRESTIGE.pricePerHop * 100) }),
    sellText,
    sellLabel: t('legacy.sell', { hops }),
    canSell: sellable,
    rows,
  };
}
