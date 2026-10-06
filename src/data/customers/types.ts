import type { Effect } from '@/data/common';

export type CustomerId = string;

/** Name and flavour line are i18n texts: `customers.<id>.name` and `customers.<id>.tagline`. */
export interface CustomerDef {
  id: CustomerId;
  minReputation: number;
  patienceSeconds: number;
  spendMultiplier: number;
  likes: readonly Effect[];
}
