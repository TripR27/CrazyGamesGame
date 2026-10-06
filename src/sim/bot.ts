import type { GameState } from '@/core/state';
import type { Store } from '@/core/store';
import { recipes, type RecipeDef } from '@/data/recipes';
import { upgrades } from '@/data/upgrades';
import { waitingCustomers } from '@/systems/customers';
import { discoverableRecipes } from '@/systems/recipes';
import { quoteFor } from '@/systems/upgrades';
import type { GameWorld } from '@/wiring/create-services';

export interface BotOptions {
  /** Buy upgrades (the cheapest affordable one, one level at a time). */
  buys: boolean;
}

/** A simulated player: one mouse action per call, like a quick but not superhuman player. */
export interface Bot {
  act(): void;
}

const fits = (contents: readonly string[], r: RecipeDef): boolean => contents.every((id) => r.ingredients.includes(id));

/** What to brew next: a recipe to discover first (players try new ones soon), then what a waiting customer wants. */
function targetRecipe(world: GameWorld, state: GameState): RecipeDef | undefined {
  const { station, floor } = world.scene;
  const known = recipes.filter((r) => state.recipesDiscovered.includes(r.id));
  const wanted = waitingCustomers(floor)
    .map((c) => known.find((r) => r.id === c.recipeId))
    .filter((r): r is RecipeDef => r !== undefined && !station.ready.includes(r.id));
  const options = [...discoverableRecipes(state, recipes), ...wanted];
  return options.find((r) => fits(station.contents, r));
}

function serveReady(world: GameWorld): boolean {
  const { floor, station, actions } = world.scene;
  const customer = waitingCustomers(floor).find((c) => station.ready.includes(c.recipeId));
  if (customer === undefined) return false;
  actions.clickCustomer(customer.id);
  return true;
}

function brewNext(world: GameWorld, state: GameState): boolean {
  const { station, actions } = world.scene;
  if (station.brewing !== null || station.ready.length >= station.capacity) return false;
  const next = targetRecipe(world, state)?.ingredients.find((id) => !station.contents.includes(id));
  if (next === undefined) return false;
  actions.clickIngredient(next);
  return true;
}

function buyCheapest(world: GameWorld, state: GameState): boolean {
  const deals = upgrades.map((def) => ({ def, deal: quoteFor(state, def, 1) })).filter(({ deal }) => deal.affordable);
  const cheapest = deals.sort((a, b) => a.deal.cost.cmp(b.deal.cost))[0];
  if (cheapest === undefined) return false;
  world.scene.actions.buyUpgrade(cheapest.def.id, 1);
  return true;
}

export function createBot(world: GameWorld, store: Store<GameState>, options: BotOptions): Bot {
  return {
    act() {
      const state = store.getState();
      if (serveReady(world) || brewNext(world, state)) return;
      if (options.buys) buyCheapest(world, state);
    },
  };
}
