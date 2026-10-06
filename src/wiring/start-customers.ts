import type { EventBus } from '@/core/events';
import type { GameEvents } from '@/core/game-events';
import type { Rng } from '@/core/rng';
import type { GameState } from '@/core/state';
import type { Store } from '@/core/store';
import { startCustomerSystem, type CustomerCatalog, type CustomerFloor } from '@/systems/customers';
import { getMultipliers } from '@/systems/economy';
import { openSeats, type SeatPlan } from '@/systems/rooms';

const TUTORIAL_MAX_CUSTOMERS = 1;

export interface CustomerWiring {
  store: Store<GameState>;
  bus: EventBus<GameEvents>;
  rng: Rng;
  floor: CustomerFloor;
  catalog: CustomerCatalog;
  /** How the seat numbers are laid out: downstairs, then the rooms. */
  seatPlan: SeatPlan;
}

/** Runs the customers: as many as the player has seats, and while a lesson is on screen just one. */
export function startCustomers({ store, bus, rng, floor, catalog, seatPlan }: CustomerWiring, inLesson: () => boolean): void {
  startCustomerSystem({
    floor,
    bus,
    rng,
    catalog,
    getContext: () => {
      const state = store.getState();
      const stats = getMultipliers(state);
      // Bought seats downstairs (the player starts with one) plus the seats of every built room.
      const open = openSeats(seatPlan, Math.floor(stats.seats.toNumber()), state.roomsBuilt);
      return {
        reputation: state.reputation,
        unlockedRecipeIds: state.recipesDiscovered,
        openSeats: open,
        vipChance: stats.vipChance.toNumber(),
        // While a lesson is on screen: one customer at a time, who does not lose patience, so it can always
        // point at the right person and nobody leaves in the middle of a lesson. A lesson that has not
        // started yet (waiting for its moment) does not hold the game back.
        maxCustomers: Math.min(open.length, inLesson() ? TUTORIAL_MAX_CUSTOMERS : Infinity),
        freezePatience: inLesson(),
      };
    },
  });
}
