import { BREWING } from '@/brewing/brewing';
import { VIP_SPAWN } from '@/customers/customer-data';
import { OFFLINE } from '@/data/offline';

export type UpgradeId = string;

/** Shop grouping. Add a kind here when a new upgrade category appears. */
export type UpgradeKind = 'cauldron' | 'tavern' | 'staff';

/** The stats an upgrade or a room can change; `getMultipliers` reads these. Add a stat here and in `BASE_STATS`. */
export const UPGRADE_STATS = ['brewSpeed', 'sellPrice', 'storage', 'autoBrew', 'autoServe', 'offlineHours', 'seats', 'vipChance'] as const;
export type UpgradeStat = (typeof UPGRADE_STATS)[number];

export interface UpgradeEffect {
  stat: UpgradeStat;
  mode: 'add' | 'multiply';
  perLevel: number;
}

/** Cost of level n is `baseCost * growth^n`. Texts: `upgrades.<id>.name` and `.description`. */
export interface UpgradeDef {
  id: UpgradeId;
  kind: UpgradeKind;
  baseCost: number;
  growth: number;
  effect: UpgradeEffect;
  maxLevel?: number;
}

/**
 * What each stat is worth before any upgrade: brew speed and sell price are factors, storage is a count,
 * the staff stats are actions per second (0 until someone is hired) and offlineHours is how long staff
 * keep working while the player is away. Seats is how many customers may sit downstairs (rooms add their own
 * seats upstairs). vipChance is the chance that a new customer is a VIP, once one is open.
 */
export const BASE_STATS: Readonly<Record<UpgradeStat, number>> = {
  brewSpeed: 1,
  sellPrice: 1,
  storage: BREWING.storageCapacity,
  autoBrew: 0,
  autoServe: 0,
  offlineHours: OFFLINE.limitHours,
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

/** All upgrades in shop order. A new batch is a new file plus one spread here. */
export const upgrades: readonly UpgradeDef[] = [...tier01Upgrades, ...staffUpgrades];
