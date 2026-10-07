import { tier01Ingredients } from '@/data/ingredients/tier01';
import { tier02Ingredients } from '@/data/ingredients/tier02';
import type { IngredientDef } from '@/data/ingredients/types';

/** New tier = new file + one spread here. */
export const ingredients: readonly IngredientDef[] = [...tier01Ingredients, ...tier02Ingredients];
