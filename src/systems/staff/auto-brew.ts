import type { RecipeDef } from '@/recipes/recipe-data';
import type { Rng } from '@/shared/random';
import { addIngredient } from '@/systems/brewing/add-ingredient';
import type { BrewEvent, BrewStation } from '@/systems/brewing/types';

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
