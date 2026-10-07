import { SPAWNING } from '@/data/customers/spawning';
import type { Rng } from '@/shared/random';

/** The average time between customers at this reputation, without the random jitter. */
export function meanSpawnIntervalMs(reputation: number): number {
  const speedup = 1 + Math.max(0, reputation) * SPAWNING.reputationSpeedup;
  return Math.max(SPAWNING.minIntervalMs, SPAWNING.baseIntervalMs / speedup);
}

/** Time until the next customer: shorter with higher reputation, never below the minimum, with some jitter. */
export function nextSpawnDelayMs(reputation: number, rng: Rng): number {
  const spread = 1 + (rng() * 2 - 1) * SPAWNING.jitter;
  return Math.max(SPAWNING.minIntervalMs * (1 - SPAWNING.jitter), meanSpawnIntervalMs(reputation) * spread);
}
