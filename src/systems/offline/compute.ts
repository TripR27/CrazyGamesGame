import type { CustomerDef } from '@/data/customers/types';
import { OFFLINE } from '@/data/offline';
import type { RecipeDef } from '@/data/recipes/types';
import type { Num } from '@/shared/numbers';
import { meanSpawnIntervalMs } from '@/systems/customers/spawn-timing';
import { averageReward } from '@/systems/offline/earnings';
import type { OfflineReport } from '@/systems/offline/types';

const HOUR_MS = 3_600_000;

export interface OfflineInput {
  /** Wall-clock time the player was away. */
  awayMs: number;
  /** Staff pace in actions per second (0 means nobody is hired). */
  rates: { brew: number; serve: number };
  /** How long staff keep working while away, in hours. */
  limitHours: number;
  reputation: number;
  knownRecipes: readonly RecipeDef[];
  customerTypes: readonly CustomerDef[];
  sellMultiplier: Num;
  /** Chance that a customer is a VIP once one is open (rooms can raise it); left out means the base chance. */
  vipChance?: number;
}

/**
 * What the staff earned while the player was away, worked out with a formula (never by simulating ticks).
 * Drinks per second are limited by the slowest link: brewing, serving or the customers coming in.
 * Only a share of that pace counts (`OFFLINE.efficiency`), and only up to the offline limit.
 */
export function computeOffline(input: OfflineInput): OfflineReport {
  const awayMs = Math.max(0, input.awayMs);
  const limitMs = input.limitHours * HOUR_MS;
  const countedMs = Math.min(awayMs, limitMs);
  const hadStaff = input.rates.brew > 0 && input.rates.serve > 0;

  const customersPerSecond = 1000 / meanSpawnIntervalMs(input.reputation);
  const drinksPerSecond = Math.min(input.rates.brew, input.rates.serve, customersPerSecond);
  const served = hadStaff ? Math.floor((countedMs / 1000) * drinksPerSecond * OFFLINE.efficiency) : 0;
  const reward = averageReward(input.knownRecipes, input.customerTypes, input.reputation, input.sellMultiplier, input.vipChance);

  return {
    awayMs,
    countedMs,
    capped: awayMs > limitMs,
    limitHours: input.limitHours,
    hadStaff,
    served,
    gold: reward.gold.mul(served).round(),
    reputation: Math.floor(served * reward.reputation),
  };
}
