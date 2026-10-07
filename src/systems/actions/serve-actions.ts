import type { EventBus, GameEvents } from '@/shared/events';
import { serveAndPublish } from '@/systems/serving/publish';
import type { DrinkSelection } from '@/systems/serving/selection';
import type { ServeDeps } from '@/systems/serving/serve';

/** Handing out drinks: pick one from the bar and click a customer, or click the customer straight away. */
export interface ServeActions {
  /** Click a customer: they get the picked drink, or (with nothing picked) their own order if it is ready. */
  clickCustomer(customerId: number): void;
  /** Click the drink in this bar slot: pick it up, or put it back when it was already picked. */
  clickReadyDrink(slot: number): void;
  /** Put the picked drink back (a click on an empty spot). */
  cancelSelection(): void;
}

export type ServeActionDeps = ServeDeps & { bus: EventBus<GameEvents>; selection: DrinkSelection };

export function createServeActions(deps: ServeActionDeps): ServeActions {
  const { bus, station, selection } = deps;
  return {
    clickCustomer(customerId) {
      const outcome = serveAndPublish(deps, customerId, selection.selected() ?? undefined);
      // A refused drink stays picked, so the player can try the right customer next.
      if (outcome.kind === 'served') selection.clear();
    },
    clickReadyDrink(slot) {
      const recipeId = station.ready[slot];
      if (recipeId === undefined) return;
      const picked = selection.toggle(recipeId);
      if (picked !== null) bus.emit('drink:picked', { recipeId: picked });
    },
    cancelSelection() {
      selection.clear();
    },
  };
}
