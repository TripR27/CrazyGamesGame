import { BREWING } from '@/data/brewing';
import { OFFLINE } from '@/data/offline';
import type { UpgradeStat } from './types';

/**
 * What each stat is worth before any upgrade: brew speed and sell price are factors, storage is a count,
 * the staff stats are actions per second (0 until someone is hired) and offlineHours is how long staff
 * keep working while the player is away. Seats is how many customers may be in the tavern at once.
 */
export const BASE_STATS: Readonly<Record<UpgradeStat, number>> = {
  brewSpeed: 1,
  sellPrice: 1,
  storage: BREWING.storageCapacity,
  autoBrew: 0,
  autoServe: 0,
  offlineHours: OFFLINE.limitHours,
  seats: 1,
};
