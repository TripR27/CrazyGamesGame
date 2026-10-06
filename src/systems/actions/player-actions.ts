import type { EventBus } from '@/core/events';
import type { GameEvents } from '@/core/game-events';
import type { Rng } from '@/core/rng';
import { addIngredient, emptyCauldron, publishBrewEvent, type BrewStation } from '@/systems/brewing';
import { publishChange, type CustomerCatalog, type CustomerFloor } from '@/systems/customers';
import { serveCustomer, type EconomyStore } from '@/systems/serving';

/** Everything the player can do with the mouse. The scene calls these and never touches game rules. */
export interface PlayerActions {
  clickIngredient(ingredientId: string): void;
  clickCauldron(): void;
  clickCustomer(customerId: number): void;
}

export interface PlayerActionDeps {
  bus: EventBus<GameEvents>;
  station: BrewStation;
  floor: CustomerFloor;
  economy: EconomyStore;
  catalog: CustomerCatalog;
  rng: Rng;
  /** Read fresh on every click, so a newly discovered recipe works immediately. */
  getKnownRecipeIds(): readonly string[];
}

export function createPlayerActions(deps: PlayerActionDeps): PlayerActions {
  const { bus, station, floor, economy, catalog, rng } = deps;
  return {
    clickIngredient(ingredientId) {
      bus.emit('ingredient:clicked', { id: ingredientId });
      const known = catalog.recipes.filter((r) => deps.getKnownRecipeIds().includes(r.id));
      for (const event of addIngredient(station, ingredientId, known, rng)) publishBrewEvent(bus, event);
    },
    clickCauldron() {
      emptyCauldron(station);
    },
    clickCustomer(customerId) {
      const outcome = serveCustomer({ floor, station, economy, catalog, rng }, customerId);
      if (outcome.kind === 'served') {
        publishChange(bus, outcome.change);
        bus.emit('customer:served', outcome.event);
      } else if (outcome.kind === 'refused') {
        bus.emit('customer:refused', outcome.event);
      }
    },
  };
}
