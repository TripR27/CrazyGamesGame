import { tier01Recipes } from '@/data/recipes/tier01';
import { tier02Recipes } from '@/data/recipes/tier02';
import { tier02RareRecipes } from '@/data/recipes/tier02-rare';
import type { RecipeDef } from '@/data/recipes/types';

/** New tier = new file + one spread here. */
export const recipes: readonly RecipeDef[] = [...tier01Recipes, ...tier02Recipes, ...tier02RareRecipes];
