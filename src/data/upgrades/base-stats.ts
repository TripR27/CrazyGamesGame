import { BREWING } from '@/data/brewing';
import type { UpgradeStat } from './types';

/** What each stat is worth before any upgrade: brew speed and sell price are factors, storage is a count. */
export const BASE_STATS: Readonly<Record<UpgradeStat, number>> = {
  brewSpeed: 1,
  sellPrice: 1,
  storage: BREWING.storageCapacity,
};
