import { describe, expect, it } from 'vitest';
import { customers } from '@/data/customers';
import { ingredients } from '@/data/ingredients';
import { recipes } from '@/data/recipes';
import { STARTER_RECIPE_IDS } from '@/data/recipes/starters';
import { validateContent } from '@/data/validate';
import { EFFECTS } from '@/data/common';
import { hasKey } from '@/i18n';

describe('game content', () => {
  it('passes validation with the English translations', () => {
    expect(validateContent(hasKey)).toEqual([]);
  });

  it('has the first content set: 6 ingredients, 5 recipes, 3 customer types', () => {
    expect(ingredients).toHaveLength(6);
    expect(recipes).toHaveLength(5);
    expect(customers).toHaveLength(3);
  });

  it('lets a new player start: a customer with no reputation requirement', () => {
    expect(customers.some((c) => c.minReputation === 0)).toBe(true);
  });

  it('has a starter recipe made only of shop ingredients', () => {
    const shop = new Set(ingredients.filter((i) => i.source === 'shop').map((i) => i.id));
    const starter = recipes.filter((r) => r.tier === 1 && r.ingredients.every((i) => shop.has(i)));
    expect(starter.length).toBeGreaterThan(0);
  });

  it('only gives new players recipes that exist', () => {
    const ids = new Set(recipes.map((r) => r.id));
    expect(STARTER_RECIPE_IDS.length).toBeGreaterThan(0);
    expect(STARTER_RECIPE_IDS.filter((id) => !ids.has(id))).toEqual([]);
  });

  it('covers every drink effect with at least one recipe', () => {
    const covered = new Set(recipes.map((r) => r.effect));
    expect([...covered].sort()).toEqual([...EFFECTS].sort());
  });

  it('uses every ingredient in at least one recipe', () => {
    const used = new Set(recipes.flatMap((r) => r.ingredients));
    expect(ingredients.filter((i) => !used.has(i.id))).toEqual([]);
  });
});
