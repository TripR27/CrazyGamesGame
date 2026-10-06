import { describe, expect, it } from 'vitest';
import { guideRecipe, likedCustomer, nextIngredient, readyCustomerId, resolveTarget, type GuideContext } from '@/systems/tutorial';
import { recipes } from '../fixtures';

/** A waiting customer; `liked` when they like the effect of what they ordered. */
const w = (id: number, recipeId: string, liked = false, vip = false) => ({ id, recipeId, liked, vip });

const ctx = (over: Partial<GuideContext> = {}): GuideContext => ({
  knownRecipes: recipes,
  contents: [],
  brewingRecipeId: null,
  readyRecipeIds: [],
  customers: [],
  affordableUpgradeId: null,
  affordableSeatsId: null,
  affordableStaffId: null,
  openTab: null,
  ...over,
});

describe('guide recipe', () => {
  it('teaches what the oldest waiting customer ordered', () => {
    expect(guideRecipe(ctx({ customers: [w(1, 'cde'), w(2, 'ab')] }))?.id).toBe('cde');
  });

  it('falls back to the first known recipe when nobody is waiting', () => {
    expect(guideRecipe(ctx())?.id).toBe('ab');
  });

  it('sticks to a recipe that fits what is already in the cauldron', () => {
    const waiting = [w(1, 'cde')];
    expect(guideRecipe(ctx({ contents: ['a'], customers: waiting }))?.id).toBe('ab');
  });

  it('talks about the drink that is brewing or ready', () => {
    expect(guideRecipe(ctx({ brewingRecipeId: 'cde', customers: [w(1, 'ab')] }))?.id).toBe('cde');
    expect(guideRecipe(ctx({ readyRecipeIds: ['cde'] }))?.id).toBe('cde');
  });

  it('has nothing to say when no recipe is known', () => {
    expect(guideRecipe(ctx({ knownRecipes: [] }))).toBeUndefined();
  });
});

describe('guide ingredient and customer', () => {
  const waiting = [w(7, 'cde')];

  it('points at the next missing ingredient, and stops when the recipe is complete', () => {
    expect(nextIngredient(ctx({ customers: waiting }))).toBe('c');
    expect(nextIngredient(ctx({ customers: waiting, contents: ['c'] }))).toBe('d');
    expect(nextIngredient(ctx({ customers: waiting, contents: ['c', 'd', 'e'] }))).toBeUndefined();
  });

  it('points at the oldest customer whose drink is ready', () => {
    const customers = [w(1, 'ab'), w(2, 'cde'), w(3, 'cde')];
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
    const waiting = [w(7, 'ab')];
    expect(resolveTarget('guide-ingredient', ctx({ customers: waiting }))).toBe('ingredient:a');
    expect(resolveTarget('guide-ingredient', ctx({ customers: waiting, contents: ['a', 'b'] }))).toBeNull();
    expect(resolveTarget('guide-customer', ctx({ customers: waiting }))).toBeNull();
    expect(resolveTarget('guide-customer', ctx({ customers: waiting, readyRecipeIds: ['ab'] }))).toBe('customer:7');
  });

  it('points at the oldest customer who ordered a drink they like, or nobody', () => {
    const customers = [w(1, 'ab'), w(2, 'cde', true), w(3, 'ab', true)];
    expect(likedCustomer(ctx({ customers }))?.id).toBe(2);
    expect(resolveTarget('guide-liked', ctx({ customers }))).toBe('customer:2');
    expect(resolveTarget('guide-liked', ctx({ customers: [w(1, 'ab')] }))).toBeNull();
  });
});
