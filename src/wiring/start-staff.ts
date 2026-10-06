import type { EventBus } from '@/core/events';
import type { GameEvents } from '@/core/game-events';
import type { Rng } from '@/core/rng';
import type { GameState } from '@/core/state';
import type { Store } from '@/core/store';
import { recipes } from '@/data/recipes';
import { getMultipliers } from '@/systems/economy';
import type { CustomerCatalog, CustomerFloor } from '@/systems/customers';
import type { BrewStation } from '@/systems/brewing';
import { startStaff } from '@/systems/staff';

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
