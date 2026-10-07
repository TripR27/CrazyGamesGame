import { recipes, type RecipeDef } from '@/recipes/recipe-data';
import type { GameState, Store } from '@/shared/state';
import { shopOnce } from '@/sim/shopping';
import { waitingCustomers } from '@/systems/customers/floor';
import type { GameWorld } from '@/wiring/create-services';
import { createIngredientShelf, type IngredientShelf } from '@/wiring/ingredient-shelf';

export interface BotOptions {
  /** Shop: ingredients, rooms (saving up for them) and the cheapest upgrade, one purchase at a time (sim/shopping.ts). */
  buys: boolean;
}

/** A simulated player: one mouse action per call, like a quick but not superhuman player. */
export interface Bot {
  act(): void;
}

const fits = (contents: readonly string[], r: RecipeDef): boolean => contents.every((id) => r.ingredients.includes(id));

/** What to brew next: a recipe to discover first (players try new ones soon), then what a waiting customer wants. */
function targetRecipe(world: GameWorld, state: GameState, shelf: IngredientShelf): RecipeDef | undefined {
  const { station, floor } = world.scene;
  const known = recipes.filter((r) => state.recipesDiscovered.includes(r.id));
  const wanted = waitingCustomers(floor)
    .map((c) => known.find((r) => r.id === c.recipeId))
    .filter((r): r is RecipeDef => r !== undefined && !station.ready.includes(r.id));
  const options = [...shelf.getDiscoverable(), ...wanted];
  return options.find((r) => fits(station.contents, r));
}

function serveReady(world: GameWorld): boolean {
  const { floor, station, actions } = world.scene;
  const customer = waitingCustomers(floor).find((c) => station.ready.includes(c.recipeId));
  if (customer === undefined) return false;
  actions.clickCustomer(customer.id);
  return true;
}

function brewNext(world: GameWorld, state: GameState, shelf: IngredientShelf): boolean {
  const { station, actions } = world.scene;
  if (station.brewing !== null || station.ready.length >= station.capacity) return false;
  const next = targetRecipe(world, state, shelf)?.ingredients.find((id) => !station.contents.includes(id));
  if (next === undefined) return false;
  actions.clickIngredient(next);
  return true;
}

export function createBot(world: GameWorld, store: Store<GameState>, options: BotOptions): Bot {
  const shelf = createIngredientShelf(store);
  return {
    act() {
      const state = store.getState();
      if (serveReady(world) || brewNext(world, state, shelf)) return;
      if (options.buys) shopOnce(world, state, shelf);
    },
  };
}
