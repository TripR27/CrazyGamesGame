import { staffUpgrades } from '@/data/upgrades/staff';
import { tier01Upgrades } from '@/data/upgrades/tier01';
import type { UpgradeDef } from '@/data/upgrades/types';

/** All upgrades in shop order. A new batch is a new file plus one spread here. */
export const upgrades: readonly UpgradeDef[] = [...tier01Upgrades, ...staffUpgrades];
