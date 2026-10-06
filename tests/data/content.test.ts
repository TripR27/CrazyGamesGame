import { describe, expect, it } from 'vitest';
import { customers } from '@/data/customers';
import { ingredients } from '@/data/ingredients';
import { recipes } from '@/data/recipes';
import { REPUTATION_LEVELS } from '@/data/reputation/levels';
import { STARTER_RECIPE_IDS } from '@/data/recipes/starters';
import { validateContent } from '@/data/validate';
import { EFFECTS } from '@/data/common';
import { hasKey } from '@/i18n';

describe('game content', () => {
  it('passes validation with the English translations', () => {
    expect(validateContent(hasKey)).toEqual([]);
  });

  it('has the content of step 12: 6 ingredients, 13 recipes, 3 customer types and a VIP', () => {
    expect(ingredients).toHaveLength(6);
    expect(recipes).toHaveLength(13);
    expect(customers.filter((c) => c.vip !== true)).toHaveLength(3);
    expect(customers.filter((c) => c.vip === true)).toHaveLength(1);
  });

  it('lets a new player start: a regular customer at the first level', () => {
    expect(customers.some((c) => c.minLevel === 1 && c.vip !== true)).toBe(true);
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

  it('only unlocks recipes whose shop ingredients can be bought by that level', () => {
    const available = (id: string, level: number): boolean => {
      const def = ingredients.find((i) => i.id === id);
      return def !== undefined && def.source === 'shop' && (def.buy?.level ?? 1) <= level;
    };
    const tooEarly = REPUTATION_LEVELS.flatMap((l, i) =>
      (l.unlocks ?? []).filter((id) => !(recipes.find((r) => r.id === id)?.ingredients ?? []).every((ing) => available(ing, i + 1))),
    );
    expect(tooEarly).toEqual([]);
  });

  it('sells one new ingredient per level from level 2 on', () => {
    expect(ingredients.filter((i) => i.buy !== undefined).map((i) => i.buy?.level)).toEqual([2, 3, 4]);
  });

  it('uses every ingredient in at least one recipe', () => {
    const used = new Set(recipes.flatMap((r) => r.ingredients));
    expect(ingredients.filter((i) => !used.has(i.id))).toEqual([]);
  });
});
