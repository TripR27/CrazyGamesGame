import { describe, expect, it } from 'vitest';
import type { CustomerDef } from '@/data/customers/types';
import { ingredients } from '@/data/ingredients/index';
import type { IngredientDef } from '@/data/ingredients/types';
import { validateContent } from '@/data/validate/index';
import { ingredientTable } from '@/data/validate/ingredient-table';
import type { ContentTable } from '@/data/validate/table';
import { customerTable, feedbackTable, recipeTable } from '@/data/validate/tables';
import type { RecipeDef } from '@/recipes/recipe-data';

const allKeys = (): boolean => true;
const noKeys = (): boolean => false;
const ing = (id: string, over: Partial<IngredientDef> = {}): IngredientDef => ({
  id, tier: 1, rarity: 'common', source: 'shop', ...over,
});
const rec = (id: string, over: Partial<RecipeDef> = {}): RecipeDef => ({
  id, tier: 1, rarity: 'common', ingredients: ['a', 'b'], brewSeconds: 3, basePrice: 5, effect: 'luck', ...over,
});
const cust = (id: string, over: Partial<CustomerDef> = {}): CustomerDef => ({
  id, minLevel: 1, patienceSeconds: 30, spendMultiplier: 1, likes: ['luck'], ...over,
});
const base = (): ContentTable[] => [ingredientTable([ing('a'), ing('b')])];
const problems = (...tables: ContentTable[]): string[] => validateContent(allKeys, tables);

describe('validateContent', () => {
  it('accepts a small valid set', () => {
    expect(problems(...base(), recipeTable([rec('r1')]), customerTable([cust('c1')]))).toEqual([]);
  });

  it('reports duplicate ids and non-snake_case ids', () => {
    const out = problems(ingredientTable([ing('a'), ing('a'), ing('Bad-Id')]));
    expect(out.join('\n')).toMatch(/id is used more than once/);
    expect(out.join('\n')).toMatch(/must be snake_case/);
  });

  it('reports recipes that point at unknown ingredients', () => {
    const out = problems(...base(), recipeTable([rec('r1', { ingredients: ['a', 'ghost'] })]));
    expect(out).toEqual(['recipes.r1: unknown ingredient "ghost"']);
  });

  it('reports a shop purchase at a wrong level, for free, or of a dungeon ingredient', () => {
    const out = problems(ingredientTable([
      ing('a', { buy: { level: 1, cost: 10 } }), ing('b', { buy: { level: 2, cost: 0 } }), ing('c', { source: 'dungeon:cave', buy: { level: 2, cost: 5 } }),
    ]));
    expect(out).toEqual([expect.stringMatching(/^ingredients\.a: buy\.level/), expect.stringMatching(/^ingredients\.b: buy\.cost/), 'ingredients.c: only shop ingredients can be bought']);
  });

  it('reports repeated ingredients and wrong ingredient counts', () => {
    const out = problems(...base(), recipeTable([rec('r1', { ingredients: ['a', 'a'] })]));
    expect(out).toEqual(['recipes.r1: ingredient "a" is listed twice']);
    const one = rec('r2', { ingredients: ['a'] as unknown as RecipeDef['ingredients'] });
    expect(problems(...base(), recipeTable([one]))).toContain('recipes.r2: needs 2 or 3 ingredients');
  });

  it('reports two recipes with the same combination, whatever the order', () => {
    const out = problems(...base(), recipeTable([rec('r1'), rec('r2', { ingredients: ['b', 'a'] })]));
    expect(out).toEqual(['recipes: two recipes share the combination a+b']);
  });

  it('reports a recipe that is a part of a bigger recipe, since it could never be finished', () => {
    const big = rec('big', { ingredients: ['a', 'b', 'c'] });
    const out = problems(...base(), ingredientTable([ing('c')]), recipeTable([rec('small'), big]));
    expect(out).toContain('recipes: recipe small is a part of recipe big');
  });

  it('reports missing feedback lines', () => {
    const out = validateContent((k) => k === 'feedback.pool.1', [feedbackTable([{ id: 'served', lines: 2 }])]);
    expect(out).toEqual(['missing translation key feedback.served.1', 'missing translation key feedback.served.2']);
  });

  it('reports invalid numbers and unknown effects or rarities', () => {
    const bad = rec('r1', { brewSeconds: 0, basePrice: -1, tier: 0, effect: 'rage' as never, rarity: 'meh' as never });
    expect(problems(...base(), recipeTable([bad]))).toHaveLength(5);
    expect(problems(customerTable([cust('c1', { spendMultiplier: 0, minLevel: 0 })]))).toHaveLength(2);
  });

  it('reports a bad ingredient source', () => {
    const out = problems(ingredientTable([ing('a', { source: 'moon' as never })]));
    expect(out).toHaveLength(1);
  });

  it('reports every missing translation key', () => {
    const out = validateContent(noKeys, [ingredientTable([ing('a')]), customerTable([cust('c1')])]);
    expect(out).toEqual([
      'missing translation key ingredients.a.name',
      'missing translation key customers.c1.name',
      'missing translation key customers.c1.tagline',
    ]);
  });

  it('works on the real ingredient list too', () => {
    expect(validateContent(allKeys, [ingredientTable(ingredients)])).toEqual([]);
  });
});
