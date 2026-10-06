import { tier01Upgrades } from './tier01';
import type { UpgradeDef } from './types';

export type { UpgradeDef, UpgradeEffect, UpgradeId, UpgradeKind, UpgradeStat } from './types';
export { BASE_STATS } from './base-stats';

/** All upgrades in shop order. A new batch is a new file plus one spread here. */
export const upgrades: readonly UpgradeDef[] = [...tier01Upgrades];
