import { BREWING } from '@/data/brewing';
import type { RecipeDef } from '@/data/recipes/types';
import type { Rng } from '@/shared/random';
import { canGrow, matchRecipe } from '@/systems/brewing/match';
import type { BrewEvent, BrewStation } from '@/systems/brewing/types';
import { feedbackKey } from '@/systems/feedback';

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
