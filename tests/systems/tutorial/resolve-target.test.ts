import { describe, expect, it } from 'vitest';
import { resolveTarget, type GuideContext } from '@/systems/tutorial';
import { recipes } from '../fixtures';

const ctx = (over: Partial<GuideContext> = {}): GuideContext => ({
  knownRecipes: recipes,
  contents: [],
  brewingRecipeId: null,
  readyRecipeIds: [],
  customers: [],
  affordableUpgradeId: 'price_up',
  affordableSeatsId: null,
  affordableStaffId: null,
  affordableIngredientId: null,
  newestIngredientId: null,
  openTab: null,
  ...over,
});

describe('pointing at a drink on the bar', () => {
  it('points at the slot of the drink a waiting customer ordered, or nowhere', () => {
    const customers = [{ id: 1, recipeId: 'cde', liked: false, vip: false }];
    expect(resolveTarget('guide-drink', ctx({ customers, readyRecipeIds: ['ab', 'cde'] }))).toBe('drink:1');
    expect(resolveTarget('guide-drink', ctx({ customers, readyRecipeIds: ['ab'] }))).toBeNull();
  });
});

describe('the way to a tab of the side panel', () => {
  it('points at the button that unfolds the panel first', () => {
    expect(resolveTarget('guide-shop', ctx())).toBe('panel-button');
    expect(resolveTarget('guide-book', ctx())).toBe('panel-button');
    expect(resolveTarget('guide-upgrade', ctx())).toBe('panel-button');
  });

  it('points at the tab when the panel shows another one', () => {
    expect(resolveTarget('guide-shop', ctx({ openTab: 'recipes' }))).toBe('tab:shop');
    expect(resolveTarget('guide-book', ctx({ openTab: 'shop' }))).toBe('tab:recipes');
    expect(resolveTarget('guide-upgrade', ctx({ openTab: 'recipes' }))).toBe('tab:shop');
  });

  it('points inside the shop once its tab is on screen', () => {
    expect(resolveTarget('guide-upgrade', ctx({ openTab: 'shop' }))).toBe('upgrade:price_up');
    expect(resolveTarget('guide-seats', ctx({ openTab: 'shop' }))).toBeNull();
    expect(resolveTarget('guide-shop', ctx({ openTab: 'shop' }))).toBeNull();
  });
});
