import type { EventBus } from '@/core/events';
import type { GameEvents } from '@/core/game-events';
import type { Rng } from '@/core/rng';
import type { GameState } from '@/core/state';
import type { Store } from '@/core/store';
import { BREWING } from '@/data/brewing';
import { customers } from '@/data/customers';
import { ingredients } from '@/data/ingredients';
import { recipes } from '@/data/recipes';
import { CUSTOMER_SLOTS } from '@/scene/layout';
import type { SceneServices } from '@/scene/services';
import { createPlayerActions } from '@/systems/actions';
import { createStation, shelfIngredients, startBrewSystem } from '@/systems/brewing';
import { createFloor, startCustomerSystem } from '@/systems/customers';

export interface WiringDeps {
  store: Store<GameState>;
  bus: EventBus<GameEvents>;
  rng: Rng;
}

/**
 * The composition root for the game world: builds the runtime objects (customer floor, cauldron and bar),
 * starts the systems that run on the tick, and returns what the scenes need.
 */
export function createServices({ store, bus, rng }: WiringDeps): SceneServices {
  const catalog = { customerTypes: customers, recipes };
  const floor = createFloor(CUSTOMER_SLOTS.length);
  const station = createStation(BREWING.storageCapacity);
  const knownIds = (): readonly string[] => store.getState().recipesDiscovered;

  startCustomerSystem({
    floor,
    bus,
    rng,
    catalog,
    getContext: () => ({ reputation: store.getState().reputation, unlockedRecipeIds: knownIds() }),
  });
  startBrewSystem(station, bus);

  const actions = createPlayerActions({ bus, station, floor, economy: store, catalog, rng, getKnownRecipeIds: knownIds });
  const getShelf = (): readonly string[] =>
    shelfIngredients(ingredients, recipes.filter((r) => knownIds().includes(r.id))).map((i) => i.id);
  return { bus, floor, station, actions, getShelf };
}
