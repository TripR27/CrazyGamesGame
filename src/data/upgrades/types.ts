export type UpgradeId = string;

/** Shop grouping. Add a kind here when a new upgrade category appears. */
export type UpgradeKind = 'cauldron' | 'tavern' | 'staff';

/** The stats an upgrade can change; `getMultipliers` reads these. Add a stat here and in `BASE_STATS`. */
export const UPGRADE_STATS = ['brewSpeed', 'sellPrice', 'storage', 'autoBrew', 'autoServe', 'offlineHours'] as const;
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
