import type { IngredientDef } from '@/data/ingredients/types';
import type { RecipeDef } from '@/recipes/recipe-data';

/** What owning ingredients depends on (interface segregation: not the whole state). */
export interface IngredientState {
  ingredientsBought: readonly string[];
  recipesDiscovered: readonly string[];
}

/** A shop ingredient that is on the shelf from the start (nothing to buy). */
export const isBasic = (def: IngredientDef): boolean => def.source === 'shop' && def.buy === undefined;

/**
 * The ingredients the player has, in content order: the basic ones, the bought ones, and everything a known recipe
 * uses (a known recipe was brewed, so its ingredients were there; this also keeps older saves brewable).
 */
export function ownedIngredients(
  state: IngredientState,
  ingredients: readonly IngredientDef[],
  recipes: readonly RecipeDef[],
): IngredientDef[] {
  const used = new Set(recipes.filter((r) => state.recipesDiscovered.includes(r.id)).flatMap((r) => r.ingredients));
  return ingredients.filter((i) => isBasic(i) || state.ingredientsBought.includes(i.id) || used.has(i.id));
}
