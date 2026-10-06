/** Placeholder customer flow numbers; tuned in step 11 and 13. */
export const SPAWNING = {
  /** The first customer comes quickly: the player should see something within seconds. */
  firstDelayMs: 1500,
  baseIntervalMs: 8000,
  minIntervalMs: 3000,
  /** Each reputation point shortens the interval by this fraction of the base. */
  reputationSpeedup: 0.02,
  /** Random spread around the interval, as a fraction (0.3 = plus or minus 30%). */
  jitter: 0.3,
} as const;
