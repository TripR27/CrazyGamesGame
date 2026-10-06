import { num, type Num } from '@/core/numbers';
import type { OneTimePurchase } from '@/data/common';
import { levelFor } from '@/systems/reputation';

/** How a one-time purchase stands: not yet (level too low), for sale, or already owned. */
export type OfferStatus = 'locked' | 'forSale' | 'owned';

export interface OneTimeOffer {
  status: OfferStatus;
  cost: Num;
  affordable: boolean;
}

/** What a one-time purchase looks at: the reputation level and the gold. */
export interface BuyerState {
  reputation: number;
  currencies: { gold: Num };
}

/** The offer for something bought once (an ingredient, a room). Without a price it can never be bought. */
export function oneTimeOffer(price: OneTimePurchase | undefined, owned: boolean, state: BuyerState): OneTimeOffer {
  const cost = num(price?.cost ?? 0);
  if (owned) return { status: 'owned', cost, affordable: false };
  const open = price !== undefined && levelFor(state.reputation) >= price.level;
  return { status: open ? 'forSale' : 'locked', cost, affordable: open && state.currencies.gold.gte(cost) };
}
