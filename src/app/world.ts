import { createPlayerActions } from '@/app/actions';
import { type BrewStation, BREWING, createStation, startBrewSystem } from '@/brewing/brewing';
import { type IngredientCatalog, watchIngredientShop, createIngredientShelf } from '@/brewing/ingredients';
import { customers } from '@/customers/customer-data';
import { startCustomerSystem, type CustomerCatalog, type CustomerFloor, createFloor } from '@/customers/customers';
import { upgrades } from '@/economy/upgrade-data';
import { getMultipliers, watchAffordable, generalOnly, seatsOnly, staffOnly } from '@/economy/upgrades';
import { createOffline, type OfflineServices } from '@/offline/offline';
import { recipes } from '@/recipes/recipe-data';
import { recordDiscoveries } from '@/recipes/recipes';
import { watchReputationLevels } from '@/reputation/reputation';
import { ROOMS, watchRoomShop, openSeats, type SeatPlan, roomOffer, totalSeats } from '@/rooms/rooms';
import { CUSTOMER_SLOTS } from '@/scene/layout';
import type { SceneServices } from '@/scene/services';
import { createDrinkSelection } from '@/serving/serving';
import type { EventBus, GameEvents } from '@/shared/events';
import type { Rng } from '@/shared/random';
import type { GameState, Store } from '@/shared/state';
import { createTargetRegistry, type TargetRegistry } from '@/shared/targets';
import { systemClock, type Clock } from '@/shared/time';
import { startStaff } from '@/staff/staff';
import { createTutorial, type TutorialServices } from '@/tutorial/tutorial-context';

/**
 * Keeps the cauldron and bar in step with the bought upgrades: bar size and brew speed.
 * A brew that is already running keeps its speed; the next one uses the new value. Returns a stop function.
 */
export function syncStationStats(store: Store<GameState>, station: BrewStation): () => void {
  const apply = (): void => {
    const stats = getMultipliers(store.getState());
    station.capacity = Math.floor(stats.storage.toNumber());
    station.speed = stats.brewSpeed.toNumber();
  };
  apply();
  return store.subscribe(apply);
}

/** Tutorial moments: the first shop upgrade, extra seat, staff member, ingredient and room become affordable. */
export function watchShop(store: Store<GameState>, bus: EventBus<GameEvents>, ingredients: IngredientCatalog): void {
  watchAffordable(store, bus, generalOnly(upgrades));
  watchAffordable(store, bus, seatsOnly(upgrades), 'seats:affordable');
  watchAffordable(store, bus, staffOnly(upgrades), 'staff:affordable');
  watchIngredientShop(store, bus, ingredients);
  watchRoomShop(store, bus, ROOMS);
}

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
