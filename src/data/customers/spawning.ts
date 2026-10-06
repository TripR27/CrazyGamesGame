/** Placeholder customer flow numbers; tuned in step 13. Customers come gradually, not all at once. */
export const SPAWNING = {
  /** The first customer comes after a few seconds: the player sees something soon, but is not rushed. */
  firstDelayMs: 3000,
  baseIntervalMs: 12_000,
  minIntervalMs: 3000,
  /** A seat that frees up is not refilled at once: the next customer needs at least this long to walk in. */
  refillDelayMs: 2500,
  /** Each reputation point shortens the interval by this fraction of the base. */
  reputationSpeedup: 0.02,
  /** Random spread around the interval, as a fraction (0.3 = plus or minus 30%). */
  jitter: 0.3,
} as const;
