import type { Rng } from '@/core/rng';
import { BREWING } from '@/data/brewing';
import type { RecipeDef } from '@/data/recipes';
import { feedbackKey } from '@/systems/feedback';
import { canGrow, matchRecipe } from './match';
import type { BrewEvent, BrewStation } from './types';

const notice = (kind: 'busy' | 'full' | 'fizzle', rng: Rng): BrewEvent => ({
  kind: 'notice',
  notice: kind,
  messageKey: feedbackKey(kind, rng),
});

/**
 * Put one ingredient in the cauldron. A complete known recipe starts brewing at once; a combination
 * that cannot become any known recipe fizzles (the cauldron empties). Only `knownRecipes` count.
 */
export function addIngredient(
  station: BrewStation,
  ingredientId: string,
  knownRecipes: readonly RecipeDef[],
  rng: Rng,
): BrewEvent[] {
  if (station.brewing !== null) return [notice('busy', rng)];
  if (station.ready.length >= station.capacity) return [notice('full', rng)];

  const contents = [...station.contents, ingredientId];
  const recipe = matchRecipe(contents, knownRecipes);
  if (recipe !== undefined) {
    station.contents = [];
    const totalMs = recipe.brewSeconds * 1000;
    station.brewing = { recipeId: recipe.id, remainingMs: totalMs, totalMs };
    return [{ kind: 'started', recipeId: recipe.id }];
  }
  if (contents.length >= BREWING.maxIngredients || !canGrow(contents, knownRecipes)) {
    station.contents = [];
    return [notice('fizzle', rng)];
  }
  station.contents = contents;
  return [];
}
