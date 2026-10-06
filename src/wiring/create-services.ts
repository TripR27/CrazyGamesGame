import { systemClock, type Clock } from '@/core/clock';
import type { EventBus } from '@/core/events';
import type { GameEvents } from '@/core/game-events';
import type { Rng } from '@/core/rng';
import { createTargetRegistry, type TargetRegistry } from '@/core/target-registry';
import type { GameState } from '@/core/state';
import type { Store } from '@/core/store';
import { BREWING } from '@/data/brewing';
import { customers } from '@/data/customers';
import { ingredients } from '@/data/ingredients';
import { recipes } from '@/data/recipes';
import { upgrades } from '@/data/upgrades';
import { CUSTOMER_SLOTS } from '@/scene/layout';
import type { SceneServices } from '@/scene/services';
import { createPlayerActions } from '@/systems/actions';
import { createStation, shelfIngredients, startBrewSystem } from '@/systems/brewing';
import { createFloor, startCustomerSystem } from '@/systems/customers';
import { getMultipliers } from '@/systems/economy';
import { createOffline, type OfflineServices } from './create-offline';
import { createTutorial, type TutorialServices } from './create-tutorial';
import { startStaffWork } from './start-staff';
import { syncStationStats } from './sync-station';
import { watchShop } from './watch-shop';

const TUTORIAL_MAX_CUSTOMERS = 1;

export interface WiringDeps {
  store: Store<GameState>;
  bus: EventBus<GameEvents>;
  rng: Rng;
  /** Used to mark when offline time has been counted. Defaults to the system clock. */
  clock?: Clock;
}

export interface GameWorld {
  scene: SceneServices;
  tutorial: TutorialServices;
  offline: OfflineServices;
  /** Shared by the scene and the DOM overlay, so the tutorial can point at both. */
  targets: TargetRegistry;
}

/**
 * The composition root for the game world: builds the runtime objects (customer floor, cauldron and bar),
 * starts the systems that run on the tick, and returns what the scenes need.
 */
export function createServices({ store, bus, rng, clock = systemClock }: WiringDeps): GameWorld {
  const catalog = { customerTypes: customers, recipes };
  const floor = createFloor(CUSTOMER_SLOTS.length);
  const station = createStation(BREWING.storageCapacity);
  syncStationStats(store, station);
  const knownIds = (): readonly string[] => store.getState().recipesDiscovered;
  const tutorial = createTutorial({ store, bus, floor, station });
  const inLesson = (): boolean => tutorial.machine.visibleStep() !== null;
  startCustomerSystem({
    floor,
    bus,
    rng,
    catalog,
    getContext: () => ({
      reputation: store.getState().reputation,
      unlockedRecipeIds: knownIds(),
      // While a lesson is on screen: one customer at a time, who does not lose patience, so it can always
      // point at the right person and nobody leaves in the middle of a lesson. A lesson that has not
      // started yet (waiting for its moment) does not hold the game back.
      maxCustomers: inLesson() ? TUTORIAL_MAX_CUSTOMERS : Infinity,
      freezePatience: inLesson(),
    }),
  });
  startBrewSystem(station, bus);
  watchShop(store, bus);
  startStaffWork({ store, bus, floor, station, rng, catalog });
  const actions = createPlayerActions({
    bus, station, floor, economy: store, catalog, rng, getKnownRecipeIds: knownIds,
    upgradeStore: store,
    upgradeDefs: upgrades,
    getSellMultiplier: () => getMultipliers(store.getState()).sellPrice,
  });
  const getShelf = (): readonly string[] =>
    shelfIngredients(ingredients, recipes.filter((r) => knownIds().includes(r.id))).map((i) => i.id);
  const targets = createTargetRegistry();
  const offline = createOffline({ store, bus, clock, catalog });
  return { scene: { bus, floor, station, actions, getShelf, targets }, tutorial, offline, targets };
}
