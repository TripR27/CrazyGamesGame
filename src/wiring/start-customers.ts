import type { EventBus } from '@/core/events';
import type { GameEvents } from '@/core/game-events';
import type { Rng } from '@/core/rng';
import type { GameState } from '@/core/state';
import type { Store } from '@/core/store';
import { startCustomerSystem, type CustomerCatalog, type CustomerFloor } from '@/systems/customers';
import { getMultipliers } from '@/systems/economy';

const TUTORIAL_MAX_CUSTOMERS = 1;

export interface CustomerWiring {
  store: Store<GameState>;
  bus: EventBus<GameEvents>;
  rng: Rng;
  floor: CustomerFloor;
  catalog: CustomerCatalog;
}

/** Runs the customers: as many as the player has seats, and while a lesson is on screen just one. */
export function startCustomers({ store, bus, rng, floor, catalog }: CustomerWiring, inLesson: () => boolean): void {
  // The player starts with one seat and buys more: that many customers at most.
  const seats = (): number => Math.floor(getMultipliers(store.getState()).seats.toNumber());
  startCustomerSystem({
    floor,
    bus,
    rng,
    catalog,
    getContext: () => ({
      reputation: store.getState().reputation,
      unlockedRecipeIds: store.getState().recipesDiscovered,
      // While a lesson is on screen: one customer at a time, who does not lose patience, so it can always
      // point at the right person and nobody leaves in the middle of a lesson. A lesson that has not
      // started yet (waiting for its moment) does not hold the game back.
      maxCustomers: Math.min(seats(), inLesson() ? TUTORIAL_MAX_CUSTOMERS : Infinity),
      freezePatience: inLesson(),
    }),
  });
}
