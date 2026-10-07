import { BREWING } from '@/brewing/brewing';
import { VIP_SPAWN } from '@/customers/customer-data';

export type UpgradeId = string;

/** Shop grouping. Add a kind here when a new upgrade category appears. */
export type UpgradeKind = 'cauldron' | 'tavern' | 'staff' | 'night';

/** The stats an upgrade or a room can change; `getMultipliers` reads these. Add a stat here and in `BASE_STATS`. */
export const UPGRADE_STATS = ['brewSpeed', 'sellPrice', 'storage', 'autoBrew', 'autoServe', 'offlineHours', 'offlineShare', 'seats', 'vipChance'] as const;
export type UpgradeStat = (typeof UPGRADE_STATS)[number];

export interface UpgradeEffect {
  stat: UpgradeStat;
  mode: 'add' | 'multiply';
  perLevel: number;
}

/**
 * Cost of level n is `baseCost * growth^n`. Texts: `upgrades.<id>.name` and `.description`. An upgrade with
 * `maxLevel: 1` is a one-time purchase: it leaves the shop once bought.
 */
export interface UpgradeDef {
  id: UpgradeId;
  kind: UpgradeKind;
  baseCost: number;
  growth: number;
  effect: UpgradeEffect;
  maxLevel?: number;
  /** For sale only once the player owns a level of one of these (Night Shift after the first staff member). */
  unlockedBy?: readonly UpgradeId[];
}

/**
 * What each stat is worth before any upgrade: brew speed and sell price are factors, storage is a count,
 * the staff stats are actions per second (0 until someone is hired) and offlineHours is how long staff
 * keep working while the player is away, and offlineShare is the share of their pace that counts then (0 until
 * Night Shift is bought, so being away earns nothing without it). Seats is how many customers may sit downstairs (rooms add their own
 * seats upstairs). vipChance is the chance that a new customer is a VIP, once one is open.
 */
export const BASE_STATS: Readonly<Record<UpgradeStat, number>> = {
  brewSpeed: 1,
  sellPrice: 1,
  storage: BREWING.storageCapacity,
  autoBrew: 0,
  autoServe: 0,
  /** How long staff keep working while away; upgrades (later: prestige) raise it. */
  offlineHours: 2,
  offlineShare: 0,
  seats: 1,
  vipChance: VIP_SPAWN.chance,
};

/** First shop upgrades. Placeholder numbers: tuned in step 13. */
export const tier01Upgrades: readonly UpgradeDef[] = [
  {
    id: 'swift_cauldron',
    kind: 'cauldron',
    baseCost: 20,
    growth: 1.15,
    effect: { stat: 'brewSpeed', mode: 'multiply', perLevel: 0.1 },
    maxLevel: 15,
  },
  {
    id: 'better_prices',
    kind: 'tavern',
    baseCost: 30,
    growth: 1.7,
    effect: { stat: 'sellPrice', mode: 'multiply', perLevel: 0.15 },
  },
  {
    id: 'extra_seat',
    kind: 'tavern',
    baseCost: 40,
    growth: 1.8,
    effect: { stat: 'seats', mode: 'add', perLevel: 1 },
    maxLevel: 6,
  },
  {
    id: 'bigger_bar',
    kind: 'tavern',
    baseCost: 60,
    growth: 2,
    effect: { stat: 'storage', mode: 'add', perLevel: 1 },
    maxLevel: 2,
  },
];

/**
 * Staff: level 1 is the hire, each further level is training. The effect is actions per second,
 * so one level of the brewer starts a drink every 33 seconds. Fully trained, staff do about a third of
 * what an active player does (GAME_ANALYSE.md: idle 30-40%; measured with `npm run simulate`). Placeholder numbers: tuned in step 13.
 */
export const staffUpgrades: readonly UpgradeDef[] = [
  {
    id: 'brewer_assistant',
    kind: 'staff',
    baseCost: 60,
    growth: 1.8,
    effect: { stat: 'autoBrew', mode: 'add', perLevel: 0.03 },
    maxLevel: 7,
  },
  {
    id: 'waitress',
    kind: 'staff',
    baseCost: 90,
    growth: 1.8,
    effect: { stat: 'autoServe', mode: 'add', perLevel: 0.04 },
    maxLevel: 7,
  },
];

/** The share of the staff's pace that counts while away once Night Shift is bought: being there pays better. */
export const NIGHT_SHIFT_SHARE = 0.5;

/**
 * Offline earnings are bought (step 14d): Night Shift once, after the first staff member; then a bigger share
 * (Night Owls, up to 80%) and longer hours (Long Night, up to 8 hours). Placeholder prices, checked with the simulator.
 */
export const nightShiftUpgrades: readonly UpgradeDef[] = [
  {
    id: 'night_shift',
    kind: 'night',
    baseCost: 150,
    growth: 2,
    effect: { stat: 'offlineShare', mode: 'add', perLevel: NIGHT_SHIFT_SHARE },
    maxLevel: 1,
    unlockedBy: ['brewer_assistant', 'waitress'],
  },
  {
    id: 'night_owls',
    kind: 'night',
    baseCost: 500,
    growth: 1.8,
    effect: { stat: 'offlineShare', mode: 'add', perLevel: 0.05 },
    maxLevel: 6,
    unlockedBy: ['night_shift'],
  },
  {
    id: 'long_night',
    kind: 'night',
    baseCost: 800,
    growth: 2,
    effect: { stat: 'offlineHours', mode: 'add', perLevel: 1 },
    maxLevel: 6,
    unlockedBy: ['night_shift'],
  },
];

/** All upgrades in shop order. A new batch is a new file plus one spread here. */
export const upgrades: readonly UpgradeDef[] = [...tier01Upgrades, ...staffUpgrades, ...nightShiftUpgrades];
