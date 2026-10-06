import type { IngredientDef } from '@/data/ingredients';
import type { RecipeDef } from '@/data/recipes';

/**
 * Ingredients on the shelf: the shop ingredients up to the highest tier of any known recipe.
 * Higher tiers appear as the player learns recipes, so a new player is not offered useless ingredients.
 */
export function shelfIngredients(
  ingredients: readonly IngredientDef[],
  knownRecipes: readonly RecipeDef[],
): IngredientDef[] {
  const topTier = Math.max(0, ...knownRecipes.map((r) => r.tier));
  return ingredients.filter((i) => i.source === 'shop' && i.tier <= topTier);
}
