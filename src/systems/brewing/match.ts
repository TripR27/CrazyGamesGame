import type { RecipeDef } from '@/data/recipes';

const hasDuplicates = (ids: readonly string[]): boolean => new Set(ids).size !== ids.length;

const sameSet = (a: readonly string[], b: readonly string[]): boolean =>
  !hasDuplicates(a) && a.length === b.length && a.every((id) => b.includes(id));

/** The recipe whose ingredients are exactly these, in any order. The same ingredient twice never matches. */
export function matchRecipe(contents: readonly string[], recipes: readonly RecipeDef[]): RecipeDef | undefined {
  return recipes.find((r) => sameSet(contents, r.ingredients));
}

/** True when more ingredients could still turn these into some recipe. */
export function canGrow(contents: readonly string[], recipes: readonly RecipeDef[]): boolean {
  if (hasDuplicates(contents)) return false;
  return recipes.some((r) => contents.every((id) => r.ingredients.includes(id)));
}
