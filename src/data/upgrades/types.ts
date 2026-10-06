export type UpgradeId = string;

/** Shop grouping. Add a kind here when a new upgrade category appears. */
export type UpgradeKind = 'cauldron' | 'tavern' | 'staff';

/** The stat an upgrade changes; `getMultipliers` (step 9) reads these. */
export type UpgradeStat = 'brewSpeed' | 'sellPrice' | 'storage';

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
