import { CUSTOMER_SLOTS } from '@/app/layout';
import { type BrewStation, BREWING, createStation, startBrewSystem } from '@/brewing/brewing';
import { ingredients, watchIngredientShop, type IngredientDef } from '@/brewing/ingredients';
import { customers, type CustomerDef } from '@/customers/customer-data';
import { startCustomerSystem, type CustomerCatalog, type CustomerFloor, createFloor } from '@/customers/customers';
import { DECORATIONS, type DecorDef, watchDecorShop } from '@/decor/decor';
import { upgrades, type UpgradeDef } from '@/economy/upgrade-data';
import { getMultipliers, watchAffordable, generalOnly, seatsOnly, staffOnly } from '@/economy/upgrades';
import { startHeroes } from '@/heroes/heroes';
import { createOffline, type OfflineServices } from '@/offline/offline';
import { recipes, type RecipeDef } from '@/recipes/recipe-data';
import { recordDiscoveries } from '@/recipes/recipes';
import { watchReputationLevels } from '@/reputation/reputation';
import { ROOMS, watchRoomShop, openSeats, type SeatPlan, totalSeats, type RoomDef } from '@/rooms/rooms';
import { createDrinkSelection, type DrinkSelection } from '@/serving/serving';
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

/** Tutorial moments: the first shop upgrade, extra seat, staff member, ingredient, room and decoration become affordable. */
export function watchShop(store: Store<GameState>, bus: EventBus<GameEvents>, content: Content): void {
  watchAffordable(store, bus, generalOnly(content.upgrades));
  watchAffordable(store, bus, seatsOnly(content.upgrades), 'seats:affordable');
  watchAffordable(store, bus, staffOnly(content.upgrades), 'staff:affordable');
  watchIngredientShop(store, bus, content);
  watchRoomShop(store, bus, content.rooms);
  watchDecorShop(store, bus, content.decor);
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
    getKnownRecipes: () => catalog.recipes.filter((r) => store.getState().recipesDiscovered.includes(r.id)),
    getRates: () => {
      const stats = getMultipliers(store.getState());
      return { brew: stats.autoBrew.toNumber(), serve: stats.autoServe.toNumber() };
    },
  });
}

/** The game's content tables. Tests pass a small catalogue of their own. */
export interface Content {
  customerTypes: readonly CustomerDef[];
  recipes: readonly RecipeDef[];
  upgrades: readonly UpgradeDef[];
  rooms: readonly RoomDef[];
  decor: readonly DecorDef[];
  ingredients: readonly IngredientDef[];
}

export const content: Content = { customerTypes: customers, recipes, upgrades, rooms: ROOMS, decor: DECORATIONS, ingredients };

export interface WorldDeps {
  store: Store<GameState>;
  bus: EventBus<GameEvents>;
  rng: Rng;
  /** Used to mark when offline time has been counted. Defaults to the system clock. */
  clock?: Clock;
  content?: Content;
}

/** Everything that exists while the game runs. Features take this (or the few parts they need) and nothing else. */
export interface World {
  store: Store<GameState>;
  bus: EventBus<GameEvents>;
  rng: Rng;
  clock: Clock;
  content: Content;
  /** Who is in the tavern right now. Runtime only. */
  floor: CustomerFloor;
  /** The cauldron and the bar. Runtime only. */
  station: BrewStation;
  /** The drink the player picked up from the bar. */
  selection: DrinkSelection;
  /** Shared by the scene and the DOM overlay, so the tutorial can point at both. */
  targets: TargetRegistry;
  tutorial: TutorialServices;
  offline: OfflineServices;
}

/** Builds the world once and starts what runs on the tick. The order of the calls below is the order things run. */
export function createWorld({ store, bus, rng, clock = systemClock, content: c = content }: WorldDeps): World {
  const catalog: CustomerCatalog = c;
  // Seat numbers: downstairs first, then the rooms upstairs (built or not; customers only use the open ones).
  const seatPlan = { ground: CUSTOMER_SLOTS.length, rooms: c.rooms };
  const floor = createFloor(totalSeats(seatPlan));
  const station = createStation(BREWING.storageCapacity);
  syncStationStats(store, station);
  // Announces each new reputation level (the HUD shows a message).
  watchReputationLevels(store, bus);
  recordDiscoveries(store, bus);
  const tutorial = createTutorial({ store, bus, floor, station, clock, ingredients: c });
  const inLesson = (): boolean => tutorial.machine.visibleStep() !== null;
  startCustomers({ store, bus, rng, floor, catalog, seatPlan }, inLesson);
  startBrewSystem(station, bus);
  watchShop(store, bus, c);
  startStaffWork({ store, bus, floor, station, rng, catalog });
  // Heroes come back when their trip's (absolute) end time has passed, also right after loading.
  startHeroes({ store, bus, rng, clock });
  const offline = createOffline({ store, bus, clock, catalog });
  return { store, bus, rng, clock, content: c, floor, station, selection: createDrinkSelection(station), targets: createTargetRegistry(), tutorial, offline };
}
