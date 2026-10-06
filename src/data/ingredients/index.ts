import { tier01Ingredients } from './tier01';
import { tier02Ingredients } from './tier02';
import type { IngredientDef } from './types';

export type { IngredientDef, IngredientId, IngredientPurchase, IngredientSource } from './types';

/** New tier = new file + one spread here. */
export const ingredients: readonly IngredientDef[] = [...tier01Ingredients, ...tier02Ingredients];
