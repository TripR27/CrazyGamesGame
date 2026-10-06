import { describe, expect, it } from 'vitest';
import type { RecipeDef } from '@/data/recipes';
import { customerTable, recipeTable, reputationTable, validateContent } from '@/data/validate';

const allKeys = (): boolean => true;
const recipe: RecipeDef = { id: 'r1', tier: 1, rarity: 'common', ingredients: ['a', 'b'], brewSeconds: 3, basePrice: 5, effect: 'luck' };
const recipesOnly = recipeTable([recipe]);
// The recipe table also complains about its unknown ingredients; only the reputation lines matter here.
const levelProblems = (...levels: Parameters<typeof reputationTable>[0]): string[] =>
  validateContent(allKeys, [recipesOnly, reputationTable(levels)]).filter((p) => p.startsWith('reputation'));

describe('validating reputation levels', () => {
  it('accepts levels that start at 0, climb and teach existing recipes', () => {
    expect(levelProblems({ id: 'one', minReputation: 0 }, { id: 'two', minReputation: 5, unlocks: ['r1'] })).toEqual([]);
  });

  it('reports a first level above 0, a level that does not climb and an unknown recipe', () => {
    expect(levelProblems({ id: 'one', minReputation: 3 })).toEqual(['reputation: the first level must start at 0 reputation']);
    expect(levelProblems({ id: 'one', minReputation: 0 }, { id: 'two', minReputation: 0 })).toEqual([
      'reputation: level two must need more reputation than the one before',
    ]);
    expect(levelProblems({ id: 'one', minReputation: 0, unlocks: ['nope'] })).toEqual([
      'reputation.one: unlocks unknown recipe "nope"',
    ]);
  });

  it('reports level names without a translation', () => {
    expect(validateContent(() => false, [reputationTable([{ id: 'one', minReputation: 0 }])])).toEqual([
      'missing translation key reputation.one.name',
    ]);
  });

  it('reports a customer whose level does not exist, or a negative reputation bonus', () => {
    const king = { id: 'k', minLevel: 99, patienceSeconds: 30, spendMultiplier: 3, likes: [], reputationBonus: -1 };
    expect(validateContent(allKeys, [customerTable([king])])).toHaveLength(2);
  });
});
