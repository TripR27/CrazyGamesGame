import { describe, expect, it } from 'vitest';
import { guideRecipe, nextIngredient, readyCustomerId, resolveTarget, type GuideContext } from '@/systems/tutorial';
import { recipes } from '../fixtures';

const ctx = (over: Partial<GuideContext> = {}): GuideContext => ({
  knownRecipes: recipes,
  contents: [],
  brewingRecipeId: null,
  readyRecipeIds: [],
  customers: [],
  affordableUpgradeId: null,
  affordableStaffId: null,
  shopOpen: false,
  ...over,
});

describe('guide recipe', () => {
  it('teaches what the oldest waiting customer ordered', () => {
    expect(guideRecipe(ctx({ customers: [{ id: 1, recipeId: 'cde' }, { id: 2, recipeId: 'ab' }] }))?.id).toBe('cde');
  });

  it('falls back to the first known recipe when nobody is waiting', () => {
    expect(guideRecipe(ctx())?.id).toBe('ab');
  });

  it('sticks to a recipe that fits what is already in the cauldron', () => {
    const waiting = [{ id: 1, recipeId: 'cde' }];
    expect(guideRecipe(ctx({ contents: ['a'], customers: waiting }))?.id).toBe('ab');
  });

  it('talks about the drink that is brewing or ready', () => {
    expect(guideRecipe(ctx({ brewingRecipeId: 'cde', customers: [{ id: 1, recipeId: 'ab' }] }))?.id).toBe('cde');
    expect(guideRecipe(ctx({ readyRecipeIds: ['cde'] }))?.id).toBe('cde');
  });

  it('has nothing to say when no recipe is known', () => {
    expect(guideRecipe(ctx({ knownRecipes: [] }))).toBeUndefined();
  });
});

describe('guide ingredient and customer', () => {
  const waiting = [{ id: 7, recipeId: 'cde' }];

  it('points at the next missing ingredient, and stops when the recipe is complete', () => {
    expect(nextIngredient(ctx({ customers: waiting }))).toBe('c');
    expect(nextIngredient(ctx({ customers: waiting, contents: ['c'] }))).toBe('d');
    expect(nextIngredient(ctx({ customers: waiting, contents: ['c', 'd', 'e'] }))).toBeUndefined();
  });

  it('points at the oldest customer whose drink is ready', () => {
    const customers = [{ id: 1, recipeId: 'ab' }, { id: 2, recipeId: 'cde' }, { id: 3, recipeId: 'cde' }];
    expect(readyCustomerId(ctx({ customers, readyRecipeIds: ['cde'] }))).toBe(2);
    expect(readyCustomerId(ctx({ customers, readyRecipeIds: [] }))).toBeUndefined();
  });
});

describe('resolving tutorial targets', () => {
  it('passes fixed targets through unchanged', () => {
    expect(resolveTarget('cauldron', ctx())).toBe('cauldron');
    expect(resolveTarget('hud-gold', ctx())).toBe('hud-gold');
  });

  it('turns guide aliases into registry ids, or null when there is nothing to point at', () => {
    const waiting = [{ id: 7, recipeId: 'ab' }];
    expect(resolveTarget('guide-ingredient', ctx({ customers: waiting }))).toBe('ingredient:a');
    expect(resolveTarget('guide-ingredient', ctx({ customers: waiting, contents: ['a', 'b'] }))).toBeNull();
    expect(resolveTarget('guide-customer', ctx({ customers: waiting }))).toBeNull();
    expect(resolveTarget('guide-customer', ctx({ customers: waiting, readyRecipeIds: ['ab'] }))).toBe('customer:7');
  });
});
