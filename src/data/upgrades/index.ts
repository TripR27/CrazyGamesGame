import type { UpgradeDef } from './types';

export type { UpgradeDef, UpgradeEffect, UpgradeId, UpgradeKind, UpgradeStat } from './types';

/** Empty until step 9; the schema and its validation already exist. */
export const upgrades: readonly UpgradeDef[] = [];
