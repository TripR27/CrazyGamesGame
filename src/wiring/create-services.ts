import { systemClock, type Clock } from '@/core/clock';
import type { EventBus } from '@/core/events';
import type { GameEvents } from '@/core/game-events';
import type { Rng } from '@/core/rng';
import { createTargetRegistry, type TargetRegistry } from '@/core/target-registry';
import type { GameState } from '@/core/state';
import type { Store } from '@/core/store';
import { BREWING } from '@/data/brewing';
import { customers } from '@/data/customers';
import { recipes } from '@/data/recipes';
import { ROOMS } from '@/data/rooms';
import { upgrades } from '@/data/upgrades';
import { CUSTOMER_SLOTS } from '@/scene/layout';
import type { SceneServices } from '@/scene/services';
import { createPlayerActions } from '@/systems/actions';
import { createStation, startBrewSystem } from '@/systems/brewing';
import { createFloor } from '@/systems/customers';
import { roomOffer, totalSeats } from '@/systems/rooms';
import { getMultipliers } from '@/systems/economy';
import { recordDiscoveries } from '@/systems/recipes';
import { watchReputationLevels } from '@/systems/reputation';
import { createDrinkSelection } from '@/systems/serving';
import { createOffline, type OfflineServices } from './create-offline';
import { createTutorial, type TutorialServices } from './create-tutorial';
import { createIngredientShelf } from './ingredient-shelf';
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
  // Seat numbers: downstairs first, then the rooms upstairs (built or not; customers only use the open ones).
  const seatPlan = { ground: CUSTOMER_SLOTS.length, rooms: ROOMS };
  const floor = createFloor(totalSeats(seatPlan));
  const station = createStation(BREWING.storageCapacity);
  syncStationStats(store, station);
  // Announces each new reputation level (the HUD shows a message).
  watchReputationLevels(store, bus);
  recordDiscoveries(store, bus);
  const shelf = createIngredientShelf(store);
  const knownIds = (): readonly string[] => store.getState().recipesDiscovered;
  const tutorial = createTutorial({ store, bus, floor, station, ingredients: shelf.catalog });
  const inLesson = (): boolean => tutorial.machine.visibleStep() !== null;
  startCustomers({ store, bus, rng, floor, catalog, seatPlan }, inLesson);
  startBrewSystem(station, bus);
  watchShop(store, bus, shelf.catalog);
  startStaffWork({ store, bus, floor, station, rng, catalog });
  const selection = createDrinkSelection(station);
  const actions = createPlayerActions({
    bus, station, floor, economy: store, catalog, rng, getKnownRecipeIds: knownIds, selection,
    upgradeStore: store,
    upgradeDefs: upgrades,
    getSellMultiplier: () => getMultipliers(store.getState()).sellPrice,
    getDiscoverable: shelf.getDiscoverable,
    ingredients: { store, catalog: shelf.catalog },
    rooms: { store, defs: ROOMS },
  });
  const targets = createTargetRegistry();
  const offline = createOffline({ store, bus, clock, catalog });
  const getRoomOffer = (roomId: string) => {
    const room = ROOMS.find((r) => r.id === roomId);
    return room === undefined ? undefined : roomOffer(store.getState(), room);
  };
  const scene = { bus, floor, station, selection, actions, getShelf: shelf.getShelf, getRoomOffer, targets };
  return { scene, tutorial, offline, targets };
}
