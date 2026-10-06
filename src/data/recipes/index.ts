import { tier01Recipes } from './tier01';
import { tier02Recipes } from './tier02';
import { tier02RareRecipes } from './tier02-rare';
import type { RecipeDef } from './types';

export type { RecipeDef, RecipeId, RecipeIngredients } from './types';

/** New tier = new file + one spread here. */
export const recipes: readonly RecipeDef[] = [...tier01Recipes, ...tier02Recipes, ...tier02RareRecipes];
