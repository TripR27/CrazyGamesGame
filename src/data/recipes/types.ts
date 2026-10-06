import type { Effect, Rarity } from '@/data/common';
import type { IngredientId } from '@/data/ingredients/types';

export type RecipeId = string;

/** Two or three different ingredients; the combination is what the player discovers. */
export type RecipeIngredients =
  | readonly [IngredientId, IngredientId]
  | readonly [IngredientId, IngredientId, IngredientId];

/** Name and discovery hint are i18n texts: `recipes.<id>.name` and `recipes.<id>.hint`. */
export interface RecipeDef {
  id: RecipeId;
  tier: number;
  rarity: Rarity;
  ingredients: RecipeIngredients;
  brewSeconds: number;
  basePrice: number;
  effect: Effect;
}
