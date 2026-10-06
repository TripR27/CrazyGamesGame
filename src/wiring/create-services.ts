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
import { recipes, type RecipeDef } from '@/data/recipes';
import { upgrades } from '@/data/upgrades';
import { CUSTOMER_SLOTS } from '@/scene/layout';
import type { SceneServices } from '@/scene/services';
import { createPlayerActions } from '@/systems/actions';
import { createStation, shelfIngredients, startBrewSystem } from '@/systems/brewing';
import { createFloor } from '@/systems/customers';
import { getMultipliers } from '@/systems/economy';
import { discoverableRecipes, recordDiscoveries } from '@/systems/recipes';
import { watchReputationLevels } from '@/systems/reputation';
import { createOffline, type OfflineServices } from './create-offline';
import { createTutorial, type TutorialServices } from './create-tutorial';
import { startCustomers } from './start-customers';
import { startStaffWork } from './start-staff';
import { syncStationStats } from './sync-station';
import { watchShop } from './watch-shop';

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
  // Announces each new reputation level (the HUD shows a message).
  watchReputationLevels(store, bus);
  recordDiscoveries(store, bus);
  const discoverable = (): readonly RecipeDef[] => discoverableRecipes(store.getState(), recipes);
  const knownIds = (): readonly string[] => store.getState().recipesDiscovered;
  const tutorial = createTutorial({ store, bus, floor, station });
  const inLesson = (): boolean => tutorial.machine.visibleStep() !== null;
  startCustomers({ store, bus, rng, floor, catalog }, inLesson);
  startBrewSystem(station, bus);
  watchShop(store, bus);
  startStaffWork({ store, bus, floor, station, rng, catalog });
  const actions = createPlayerActions({
    bus, station, floor, economy: store, catalog, rng, getKnownRecipeIds: knownIds,
    upgradeStore: store,
    upgradeDefs: upgrades,
    getSellMultiplier: () => getMultipliers(store.getState()).sellPrice,
    getDiscoverable: discoverable,
  });
  // The shelf also offers what a discoverable recipe needs, otherwise it could never be found.
  const getShelf = (): readonly string[] =>
    shelfIngredients(ingredients, [...recipes.filter((r) => knownIds().includes(r.id)), ...discoverable()]).map((i) => i.id);
  const targets = createTargetRegistry();
  const offline = createOffline({ store, bus, clock, catalog });
  return { scene: { bus, floor, station, actions, getShelf, targets }, tutorial, offline, targets };
}
