import type { EventBus, GameEvents } from '@/shared/events';

/** Events that announce "something in the shop can be bought now". */
export type BuyableEvent = 'ingredients:affordable' | 'rooms:affordable';

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
