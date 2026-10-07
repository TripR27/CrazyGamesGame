import type { Effect } from '@/shared/content';

export type CustomerId = string;

/** Name and flavour line are i18n texts: `customers.<id>.name` and `customers.<id>.tagline`. */
export interface CustomerDef {
  id: CustomerId;
  /** The reputation level (1 = the first) from which this customer comes to the tavern. */
  minLevel: number;
  patienceSeconds: number;
  spendMultiplier: number;
  likes: readonly Effect[];
  /** A VIP: comes now and then (see `VIP_SPAWN`) and orders the most expensive known drink. */
  vip?: boolean;
  /** Reputation on top of the normal reputation per serve. */
  reputationBonus?: number;
}

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

/**
 * Placeholder VIP numbers; tuned in step 13. VIPs are customer types with `vip: true`: once their level is
 * reached, each new customer has this chance to be a VIP, who orders the most expensive known drink.
 */
export const VIP_SPAWN = {
  chance: 0.1,
} as const;

// Placeholder numbers; tuned in step 13.
export const customers: readonly CustomerDef[] = [
  { id: 'knight', minLevel: 1, patienceSeconds: 60, spendMultiplier: 1, likes: ['speed', 'luck'] },
  { id: 'elf', minLevel: 2, patienceSeconds: 45, spendMultiplier: 1.3, likes: ['charm'] },
  { id: 'dwarf', minLevel: 3, patienceSeconds: 40, spendMultiplier: 1.6, likes: ['strength'] },
  { id: 'king', minLevel: 3, patienceSeconds: 30, spendMultiplier: 3, likes: [], vip: true, reputationBonus: 3 },
];
