import type { Rng } from '@/core/rng';
import { SPAWNING } from '@/data/customers/spawning';

/** Time until the next customer: shorter with higher reputation, never below the minimum, with some jitter. */
export function nextSpawnDelayMs(reputation: number, rng: Rng): number {
  const speedup = 1 + Math.max(0, reputation) * SPAWNING.reputationSpeedup;
  const base = Math.max(SPAWNING.minIntervalMs, SPAWNING.baseIntervalMs / speedup);
  const spread = 1 + (rng() * 2 - 1) * SPAWNING.jitter;
  return Math.max(SPAWNING.minIntervalMs * (1 - SPAWNING.jitter), base * spread);
}
