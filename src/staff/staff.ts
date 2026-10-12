import type { ActiveBrew, BrewStation } from '@/brewing/brewing';
import { waitingCustomers, type CustomerFloor } from '@/customers/customers';
import type { RecipeDef } from '@/recipes/recipe-data';
import { serveAndPublish, type ServeDeps } from '@/serving/serving';
import type { EventBus, GameEvents } from '@/shared/events';
import { feedbackKey, type Rng } from '@/shared/random';

/** Placeholder numbers, checked with `npm run simulate`. */
export const STAFF = {
  /** A full bar with a drink no waiting customer wants: after this long the staff tip the oldest such drink away. */
  clearAfterMs: 20_000,
} as const;

/**
 * How a worker keeps its pace: charge builds up with time and one action costs a full charge.
 * Charge is capped at one action, so a worker with nothing to do does not save up a burst for later.
 */
export interface Charge {
  fill(deltaMs: number, actionsPerSecond: number): void;
  ready(): boolean;
  spend(): void;
}

export function createCharge(): Charge {
  let charge = 0;
  return {
    fill(deltaMs, actionsPerSecond) {
      charge = Math.min(1, charge + (actionsPerSecond * deltaMs) / 1000);
    },
    ready: () => charge >= 1,
    spend() {
      charge = Math.max(0, charge - 1);
    },
  };
}

/**
 * The brewer's own kettle, behind the bar: the tavern cauldron is the player's alone. One drink at a time; a finished
 * drink waits in the kettle while the bar has no room for it. Runtime only, like the cauldron.
 */
export interface BrewerKettle {
  brewing: ActiveBrew | null;
  /** A finished drink waiting for room on the bar. */
  done: string | null;
}

export const createKettle = (): BrewerKettle => ({ brewing: null, done: null });

/** The drinks on their way to the bar or on it: they already answer a waiting customer's order. */
function coveredDrinks(station: BrewStation, kettle: BrewerKettle): string[] {
  const covered = [...station.ready];
  for (const id of [station.brewing?.recipeId, kettle.brewing?.recipeId, kettle.done]) if (id !== undefined && id !== null) covered.push(id);
  return covered;
}

/** The order of the oldest waiting customer that no drink on the bar or in a cauldron answers yet (each drink answers one order). */
export function wantedRecipe(waiting: readonly { recipeId: string }[], covered: readonly string[], known: readonly RecipeDef[]): RecipeDef | undefined {
  const left = [...covered];
  for (const customer of waiting) {
    const i = left.indexOf(customer.recipeId);
    if (i !== -1) {
      left.splice(i, 1);
      continue;
    }
    const recipe = known.find((r) => r.id === customer.recipeId);
    if (recipe !== undefined) return recipe;
  }
  return undefined;
}

/** Room on the bar for one more drink, keeping a place for the player's drink that is brewing. */
const barHasRoom = (station: BrewStation): boolean => station.ready.length + (station.brewing === null ? 0 : 1) < station.capacity;

/**
 * The brewer's assistant starts, in the kettle, the drink a waiting customer wants, but only with the kettle free and
 * room on the bar. Returns the recipe started, or undefined.
 */
export function startKettle(kettle: BrewerKettle, station: BrewStation, waiting: readonly { recipeId: string }[], known: readonly RecipeDef[]): RecipeDef | undefined {
  if (kettle.brewing !== null || kettle.done !== null || !barHasRoom(station)) return undefined;
  const recipe = wantedRecipe(waiting, coveredDrinks(station, kettle), known);
  if (recipe === undefined) return undefined;
  const totalMs = (recipe.brewSeconds * 1000) / station.speed;
  kettle.brewing = { recipeId: recipe.id, remainingMs: totalMs, totalMs };
  return recipe;
}

/** Runs the kettle: a finished drink goes onto the bar as soon as there is room. Returns the drink put on the bar, or undefined. */
export function advanceKettle(kettle: BrewerKettle, station: BrewStation, deltaMs: number): string | undefined {
  const brew = kettle.brewing;
  if (brew !== null) {
    brew.remainingMs -= deltaMs;
    if (brew.remainingMs > 0) return undefined;
    kettle.brewing = null;
    kettle.done = brew.recipeId;
  }
  if (kettle.done === null || !barHasRoom(station)) return undefined;
  const drink = kettle.done;
  kettle.done = null;
  station.ready.push(drink);
  return drink;
}

/** 0 to 1, how far the kettle's drink is; 1 while a finished drink waits for room. */
export function kettleProgress(kettle: BrewerKettle): number {
  if (kettle.done !== null) return 1;
  const brew = kettle.brewing;
  return brew === null ? 0 : 1 - Math.max(0, brew.remainingMs) / brew.totalMs;
}

/** The oldest waiting customer whose drink is ready on the bar: who the waitress serves next. */
export function readyCustomer(
  waiting: readonly { id: number; recipeId: string }[],
  station: BrewStation,
): number | undefined {
  return waiting.find((c) => station.ready.includes(c.recipeId))?.id;
}

/** The bar slot of the oldest drink no waiting customer wants (each customer wants one of their drink), or -1. */
export function unwantedSlot(ready: readonly string[], waiting: readonly { recipeId: string }[]): number {
  const wanted = waiting.map((c) => c.recipeId);
  for (let slot = 0; slot < ready.length; slot++) {
    const i = wanted.indexOf(ready[slot] ?? '');
    if (i === -1) return slot;
    wanted.splice(i, 1);
  }
  return -1;
}

/** The bar is full and holds a drink nobody wants: nothing new fits until someone tips it away. */
export const barClogged = (station: BrewStation, waiting: readonly { recipeId: string }[]): boolean =>
  station.ready.length >= station.capacity && unwantedSlot(station.ready, waiting) !== -1;

export interface StaffDeps {
  bus: EventBus<GameEvents>;
  station: BrewStation;
  kettle: BrewerKettle;
  floor: CustomerFloor;
  rng: Rng;
  /** What `serveAndPublish` needs besides the bus (economy, catalog and so on). */
  serve: Omit<ServeDeps, 'floor' | 'station' | 'rng'>;
  /** Read fresh on every tick, so a newly hired worker starts at once. */
  getKnownRecipes(): readonly RecipeDef[];
  /** Actions per second for each worker (0 means nobody is hired). */
  getRates(): { brew: number; serve: number };
}

/** The staff tip away the oldest unwanted drink once the bar has been clogged for `STAFF.clearAfterMs`. */
function createCleaner(deps: StaffDeps): (deltaMs: number, hired: boolean) => void {
  let cloggedMs = 0;
  return (deltaMs, hired) => {
    const waiting = waitingCustomers(deps.floor);
    if (!hired || !barClogged(deps.station, waiting)) {
      cloggedMs = 0;
      return;
    }
    cloggedMs += deltaMs;
    if (cloggedMs < STAFF.clearAfterMs) return;
    cloggedMs = 0;
    const [recipeId] = deps.station.ready.splice(unwantedSlot(deps.station.ready, waiting), 1);
    if (recipeId !== undefined) deps.bus.emit('drink:discarded', { recipeId, by: 'staff', messageKey: feedbackKey('slop', deps.rng) });
  };
}

/** Lets the hired staff work on every game tick: the brewer at the kettle, the waitress at the bar. Returns a stop function. */
export function startStaff(deps: StaffDeps): () => void {
  const brewCharge = createCharge();
  const serveCharge = createCharge();
  const clean = createCleaner(deps);
  const { bus, station, kettle } = deps;
  return bus.on('tick', ({ deltaMs }) => {
    const rates = deps.getRates();
    const landed = advanceKettle(kettle, station, deltaMs);
    if (landed !== undefined) bus.emit('brewer:done', { recipeId: landed });
    brewCharge.fill(deltaMs, rates.brew);
    serveCharge.fill(deltaMs, rates.serve);

    if (serveCharge.ready()) {
      const id = readyCustomer(waitingCustomers(deps.floor), station);
      if (id !== undefined) {
        serveAndPublish({ ...deps.serve, floor: deps.floor, station, rng: deps.rng, bus }, id);
        serveCharge.spend();
      }
    }
    if (brewCharge.ready()) {
      const recipe = startKettle(kettle, station, waitingCustomers(deps.floor), deps.getKnownRecipes());
      if (recipe !== undefined) {
        bus.emit('brewer:started', { recipeId: recipe.id });
        brewCharge.spend();
      }
    }
    clean(deltaMs, rates.brew > 0 || rates.serve > 0);
  });
}
