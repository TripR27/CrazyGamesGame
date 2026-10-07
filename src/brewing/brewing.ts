import type { World } from '@/app/world';
import { discoverableNow } from '@/brewing/ingredients';
import type { RecipeDef } from '@/recipes/recipe-data';
import type { BrewNotice, EventBus, GameEvents } from '@/shared/events';
import { type Rng, feedbackKey } from '@/shared/random';

/** Placeholder numbers for the manual brew-and-serve loop; tuned in step 9 and 13. */
export const BREWING = {
  /** Most ingredients that fit in the cauldron at once (the biggest recipe has three). */
  maxIngredients: 3,
  /** Finished drinks that can wait on the bar. Storage upgrades raise this in step 9. */
  storageCapacity: 3,
  /** Unfinished ingredients the player left for this long may be cleared by the brewer, so it is never stuck. */
  staleCauldronMs: 15_000,
} as const;

export const SERVING = {
  reputationPerServe: 1,
  /** A served customer stays this long to drink before the seat frees up (speed drinks make it shorter). */
  drinkMs: 5000,
} as const;

export interface ActiveBrew {
  recipeId: string;
  remainingMs: number;
  totalMs: number;
}

/** The cauldron and the bar. Runtime only, not saved: a new session starts with an empty cauldron. */
export interface BrewStation {
  /** Ingredient ids currently in the cauldron, in the order they were added. */
  contents: string[];
  brewing: ActiveBrew | null;
  /** Finished drinks (recipe ids) waiting on the bar. */
  ready: string[];
  /** How many finished drinks fit on the bar. */
  capacity: number;
  /** Brew speed factor from upgrades: 2 brews twice as fast. */
  speed: number;
}

/** What happened because of a player action or a tick; published on the bus by the caller. */
export type BrewEvent =
  /** The player brewed a recipe they did not know yet: it is theirs now. */
  | { kind: 'discovered'; recipeId: string }
  | { kind: 'started'; recipeId: string }
  | { kind: 'done'; recipeId: string }
  | { kind: 'notice'; notice: BrewNotice; messageKey: string };

export function createStation(capacity: number, speed = 1): BrewStation {
  return { contents: [], brewing: null, ready: [], capacity, speed };
}

/** Throw away what is in the cauldron (not while brewing). Returns true when something was removed. */
export function emptyCauldron(station: BrewStation): boolean {
  if (station.brewing !== null || station.contents.length === 0) return false;
  station.contents = [];
  return true;
}

const hasDuplicates = (ids: readonly string[]): boolean => new Set(ids).size !== ids.length;

const sameSet = (a: readonly string[], b: readonly string[]): boolean =>
  !hasDuplicates(a) && a.length === b.length && a.every((id) => b.includes(id));

/** The recipe whose ingredients are exactly these, in any order. The same ingredient twice never matches. */
export function matchRecipe(contents: readonly string[], recipes: readonly RecipeDef[]): RecipeDef | undefined {
  return recipes.find((r) => sameSet(contents, r.ingredients));
}

/** True when more ingredients could still turn these into some recipe. */
export function canGrow(contents: readonly string[], recipes: readonly RecipeDef[]): boolean {
  if (hasDuplicates(contents)) return false;
  return recipes.some((r) => contents.every((id) => r.ingredients.includes(id)));
}

const notice = (kind: 'busy' | 'full' | 'fizzle', rng: Rng): BrewEvent => ({
  kind: 'notice',
  notice: kind,
  messageKey: feedbackKey(kind, rng),
});

/**
 * Put one ingredient in the cauldron. A complete recipe starts brewing at once; one the player did not know
 * yet but could discover is announced as a discovery first ("Eureka!"). A combination that cannot become any
 * known or discoverable recipe fizzles (the cauldron empties).
 */
export function addIngredient(
  station: BrewStation,
  ingredientId: string,
  knownRecipes: readonly RecipeDef[],
  rng: Rng,
  discoverable: readonly RecipeDef[] = [],
): BrewEvent[] {
  if (station.brewing !== null) return [notice('busy', rng)];
  if (station.ready.length >= station.capacity) return [notice('full', rng)];

  const contents = [...station.contents, ingredientId];
  const candidates = [...knownRecipes, ...discoverable];
  const recipe = matchRecipe(contents, candidates);
  if (recipe !== undefined) {
    station.contents = [];
    const totalMs = (recipe.brewSeconds * 1000) / station.speed;
    station.brewing = { recipeId: recipe.id, remainingMs: totalMs, totalMs };
    const isNew = !knownRecipes.includes(recipe);
    return [...(isNew ? [{ kind: 'discovered' as const, recipeId: recipe.id }] : []), { kind: 'started', recipeId: recipe.id }];
  }
  if (contents.length >= BREWING.maxIngredients || !canGrow(contents, candidates)) {
    station.contents = [];
    return [notice('fizzle', rng)];
  }
  station.contents = contents;
  return [];
}

/** Run the brew timer. When it ends, the drink goes onto the bar. */
export function advanceBrewing(station: BrewStation, deltaMs: number): BrewEvent[] {
  const brew = station.brewing;
  if (brew === null) return [];
  brew.remainingMs -= deltaMs;
  if (brew.remainingMs > 0) return [];
  station.brewing = null;
  station.ready.push(brew.recipeId);
  return [{ kind: 'done', recipeId: brew.recipeId }];
}

/** 0 to 1, how far the current brew is; 0 when nothing is brewing. */
export function brewProgress(station: BrewStation): number {
  const brew = station.brewing;
  return brew === null ? 0 : 1 - Math.max(0, brew.remainingMs) / brew.totalMs;
}

export function publishBrewEvent(bus: EventBus<GameEvents>, event: BrewEvent): void {
  if (event.kind === 'discovered') bus.emit('recipe:discovered', { recipeId: event.recipeId });
  else if (event.kind === 'started') bus.emit('brew:started', { recipeId: event.recipeId });
  else if (event.kind === 'done') bus.emit('brew:done', { recipeId: event.recipeId });
  else bus.emit('brew:notice', { notice: event.notice, messageKey: event.messageKey });
}

/** Runs the brew timer on every game tick. Returns a stop function. */
export function startBrewSystem(station: BrewStation, bus: EventBus<GameEvents>): () => void {
  return bus.on('tick', ({ deltaMs }) => {
    for (const event of advanceBrewing(station, deltaMs)) publishBrewEvent(bus, event);
  });
}

/** The player clicks an ingredient on the shelf. A finished recipe starts brewing at once. */
export function clickIngredient(world: Pick<World, 'bus' | 'station' | 'rng' | 'store' | 'content'>, ingredientId: string): void {
  const { bus, station, rng, store, content } = world;
  bus.emit('ingredient:clicked', { id: ingredientId });
  const known = content.recipes.filter((r) => store.getState().recipesDiscovered.includes(r.id));
  for (const event of addIngredient(station, ingredientId, known, rng, discoverableNow(world))) publishBrewEvent(bus, event);
}

/** The player clicks the cauldron: throw away what is in it (not while brewing). */
export function clickCauldron({ station }: Pick<World, 'station'>): void {
  emptyCauldron(station);
}
