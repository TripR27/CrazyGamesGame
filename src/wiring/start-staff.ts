import { recipes } from '@/recipes/recipe-data';
import type { EventBus, GameEvents } from '@/shared/events';
import type { Rng } from '@/shared/random';
import type { GameState, Store } from '@/shared/state';
import type { BrewStation } from '@/systems/brewing/types';
import type { CustomerCatalog, CustomerFloor } from '@/systems/customers/types';
import { getMultipliers } from '@/systems/economy/multipliers';
import { startStaff } from '@/systems/staff/system';

export interface StaffWiring {
  store: Store<GameState>;
  bus: EventBus<GameEvents>;
  floor: CustomerFloor;
  station: BrewStation;
  rng: Rng;
  catalog: CustomerCatalog;
}

/** Puts the hired staff to work: their pace comes from the bought upgrades, and they use the same serving rules as a click. */
export function startStaffWork({ store, bus, floor, station, rng, catalog }: StaffWiring): () => void {
  return startStaff({
    bus,
    floor,
    station,
    rng,
    serve: {
      economy: store,
      catalog,
      getSellMultiplier: () => getMultipliers(store.getState()).sellPrice,
    },
    getKnownRecipes: () => recipes.filter((r) => store.getState().recipesDiscovered.includes(r.id)),
    getRates: () => {
      const stats = getMultipliers(store.getState());
      return { brew: stats.autoBrew.toNumber(), serve: stats.autoServe.toNumber() };
    },
  });
}
