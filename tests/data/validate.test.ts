import { describe, expect, it } from 'vitest';
import type { CustomerDef } from '@/data/customers';
import { ingredients, type IngredientDef } from '@/data/ingredients';
import type { RecipeDef } from '@/data/recipes';
import type { UpgradeDef } from '@/data/upgrades';
import {
  customerTable,
  ingredientTable,
  recipeTable,
  upgradeTable,
  validateContent,
  type ContentTable,
} from '@/data/validate';

const allKeys = (): boolean => true;
const noKeys = (): boolean => false;
const ing = (id: string, over: Partial<IngredientDef> = {}): IngredientDef => ({
  id, tier: 1, rarity: 'common', source: 'shop', ...over,
});
const rec = (id: string, over: Partial<RecipeDef> = {}): RecipeDef => ({
  id, tier: 1, rarity: 'common', ingredients: ['a', 'b'], brewSeconds: 3, basePrice: 5, effect: 'luck', ...over,
});
const cust = (id: string, over: Partial<CustomerDef> = {}): CustomerDef => ({
  id, minReputation: 0, patienceSeconds: 30, spendMultiplier: 1, likes: ['luck'], ...over,
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

  it('reports invalid numbers and unknown effects or rarities', () => {
    const bad = rec('r1', { brewSeconds: 0, basePrice: -1, tier: 0, effect: 'rage' as never, rarity: 'meh' as never });
    expect(problems(...base(), recipeTable([bad]))).toHaveLength(5);
    expect(problems(customerTable([cust('c1', { spendMultiplier: 0, minReputation: -1 })]))).toHaveLength(2);
  });

  it('reports a bad ingredient source', () => {
    const out = problems(ingredientTable([ing('a', { source: 'moon' as never })]));
    expect(out).toHaveLength(1);
  });

  it('validates upgrades so step 9 data is checked from day one', () => {
    const bad: UpgradeDef = {
      id: 'u1', kind: 'cauldron', baseCost: 0, growth: 1, maxLevel: 0,
      effect: { stat: 'brewSpeed', mode: 'add', perLevel: 1 },
    };
    expect(problems(upgradeTable([bad]))).toHaveLength(3);
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
