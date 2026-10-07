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
