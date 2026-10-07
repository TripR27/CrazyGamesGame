import { addIngredient, type BrewEvent, type BrewStation, BREWING, emptyCauldron, publishBrewEvent } from '@/brewing/brewing';
import { waitingCustomers, type CustomerFloor } from '@/customers/customers';
import type { RecipeDef } from '@/recipes/recipe-data';
import { serveAndPublish, type ServeDeps } from '@/serving/serving';
import type { EventBus, GameEvents } from '@/shared/events';
import type { Rng } from '@/shared/random';

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

/** Tracks how long the cauldron has held the same unfinished ingredients. */
export interface StaleWatch {
  /** Call every tick; true once the same contents have sat there for the limit. */
  isStale(contents: readonly string[], deltaMs: number): boolean;
}

/**
 * A player who drops one ingredient in and walks away would otherwise block the brewer forever (it never touches
 * the player's work). After `limitMs` without a change the brewer may clear it; a player in the middle of a
 * combination never waits that long.
 */
export function createStaleWatch(limitMs: number): StaleWatch {
  let seen = '';
  let heldMs = 0;
  return {
    isStale(contents, deltaMs) {
      const key = contents.join('+');
      if (contents.length === 0 || key !== seen) {
        seen = key;
        heldMs = 0;
        return false;
      }
      heldMs += deltaMs;
      return heldMs >= limitMs;
    },
  };
}

/** The oldest waiting customer's drink that is not already standing on the bar. */
function wantedRecipe(
  waiting: readonly { recipeId: string }[],
  station: BrewStation,
  known: readonly RecipeDef[],
): RecipeDef | undefined {
  const recipes = waiting.map((c) => known.find((r) => r.id === c.recipeId));
  return recipes.find((r) => r !== undefined && !station.ready.includes(r.id));
}

/**
 * The brewer's assistant starts the drink a waiting customer wants, but only with a free cauldron and room
 * on the bar, and never while the player has ingredients in the cauldron. Returns the brew events (empty if idle).
 */
export function startWantedBrew(
  station: BrewStation,
  waiting: readonly { recipeId: string }[],
  known: readonly RecipeDef[],
  rng: Rng,
): BrewEvent[] {
  if (station.brewing !== null || station.contents.length > 0) return [];
  if (station.ready.length >= station.capacity) return [];
  const recipe = wantedRecipe(waiting, station, known);
  if (recipe === undefined) return [];
  return recipe.ingredients.flatMap((id) => addIngredient(station, id, known, rng));
}

/** The oldest waiting customer whose drink is ready on the bar: who the waitress serves next. */
export function readyCustomer(
  waiting: readonly { id: number; recipeId: string }[],
  station: BrewStation,
): number | undefined {
  return waiting.find((c) => station.ready.includes(c.recipeId))?.id;
}

export interface StaffDeps {
  bus: EventBus<GameEvents>;
  station: BrewStation;
  floor: CustomerFloor;
  rng: Rng;
  /** What `serveAndPublish` needs besides the bus (economy, catalog and so on). */
  serve: Omit<ServeDeps, 'floor' | 'station' | 'rng'>;
  /** Read fresh on every tick, so a newly hired worker starts at once. */
  getKnownRecipes(): readonly RecipeDef[];
  /** Actions per second for each worker (0 means nobody is hired). */
  getRates(): { brew: number; serve: number };
}

/** Lets the hired staff work on every game tick. Returns a stop function. */
export function startStaff(deps: StaffDeps): () => void {
  const brewCharge = createCharge();
  const serveCharge = createCharge();
  const stale = createStaleWatch(BREWING.staleCauldronMs);
  return deps.bus.on('tick', ({ deltaMs }) => {
    const rates = deps.getRates();
    if (stale.isStale(deps.station.contents, deltaMs) && rates.brew > 0) emptyCauldron(deps.station);
    brewCharge.fill(deltaMs, rates.brew);
    serveCharge.fill(deltaMs, rates.serve);

    if (serveCharge.ready()) {
      const id = readyCustomer(waitingCustomers(deps.floor), deps.station);
      if (id !== undefined) {
        serveAndPublish({ ...deps.serve, floor: deps.floor, station: deps.station, rng: deps.rng, bus: deps.bus }, id);
        serveCharge.spend();
      }
    }
    if (brewCharge.ready()) {
      const events = startWantedBrew(deps.station, waitingCustomers(deps.floor), deps.getKnownRecipes(), deps.rng);
      if (events.length > 0) {
        events.forEach((event) => publishBrewEvent(deps.bus, event));
        brewCharge.spend();
      }
    }
  });
}
