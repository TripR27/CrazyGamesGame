import { levelFor } from '@/reputation/reputation';
import type { OneTimePurchase } from '@/shared/content';
import type { EventBus, GameEvents } from '@/shared/events';
import { num, type Num } from '@/shared/numbers';

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

/** Events that announce "something in the shop can be bought now". */
export type BuyableEvent = 'ingredients:affordable' | 'rooms:affordable' | 'decor:affordable';

export interface WatchSource<S> {
  getState(): S;
  subscribe(listener: () => void): () => void;
}

/**
 * Publishes `event` each time `canBuy` goes from false to true (a new level opened something, or the gold became
 * enough). The tutorial starts its hints on these. Returns a stop function.
 */
export function watchBuyable<S>(source: WatchSource<S>, bus: EventBus<GameEvents>, canBuy: (state: S) => boolean, event: BuyableEvent): () => void {
  let could = canBuy(source.getState());
  return source.subscribe(() => {
    const can = canBuy(source.getState());
    if (can && !could) bus.emit(event, {});
    could = can;
  });
}
