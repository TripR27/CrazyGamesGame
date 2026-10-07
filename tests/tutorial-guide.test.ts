import { describe, expect, it } from 'vitest';
import { recipes } from './fixtures';
import { guideRecipe, likedCustomer, nextIngredient, readyCustomerId, type GuideContext, resolveTarget, arrowPlacement, spotlightBounds, SPOT_PADDING } from '@/tutorial/tutorial-guide';

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
  affordableIngredientId: null,
  newestIngredientId: null,
  affordableRoomId: null,
  newestRoomId: null,
  affordableDecorId: null,
  newestDecorId: null,
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

const ctx2 = (over: Partial<GuideContext> = {}): GuideContext => ({
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
  affordableRoomId: null,
  newestRoomId: null,
  affordableDecorId: null,
  newestDecorId: null,
  openTab: null,
  ...over,
});

describe('pointing at a drink on the bar', () => {
  it('points at the slot of the drink a waiting customer ordered, or nowhere', () => {
    const customers = [{ id: 1, recipeId: 'cde', liked: false, vip: false }];
    expect(resolveTarget('guide-drink', ctx2({ customers, readyRecipeIds: ['ab', 'cde'] }))).toBe('drink:1');
    expect(resolveTarget('guide-drink', ctx2({ customers, readyRecipeIds: ['ab'] }))).toBeNull();
  });
});

describe('the way to a tab of the side panel', () => {
  it('points at the button that unfolds the panel first', () => {
    expect(resolveTarget('guide-shop', ctx2())).toBe('panel-button');
    expect(resolveTarget('guide-book', ctx2())).toBe('panel-button');
    expect(resolveTarget('guide-upgrade', ctx2())).toBe('panel-button');
  });

  it('points at the tab when the panel shows another one', () => {
    expect(resolveTarget('guide-shop', ctx2({ openTab: 'recipes' }))).toBe('tab:shop');
    expect(resolveTarget('guide-book', ctx2({ openTab: 'shop' }))).toBe('tab:recipes');
    expect(resolveTarget('guide-upgrade', ctx2({ openTab: 'recipes' }))).toBe('tab:shop');
  });

  it('points inside the shop once its tab is on screen', () => {
    expect(resolveTarget('guide-upgrade', ctx2({ openTab: 'shop' }))).toBe('upgrade:price_up');
    expect(resolveTarget('guide-seats', ctx2({ openTab: 'shop' }))).toBeNull();
    expect(resolveTarget('guide-shop', ctx2({ openTab: 'shop' }))).toBeNull();
  });
});

describe('tutorial placement', () => {
  const target = { x: 400, y: 300, w: 100, h: 50 };

  it('pads the spotlight around the target', () => {
    expect(spotlightBounds(target)).toEqual({
      x: 400 - SPOT_PADDING,
      y: 300 - SPOT_PADDING,
      w: 100 + SPOT_PADDING * 2,
      h: 50 + SPOT_PADDING * 2,
    });
  });

  it('puts the arrow above the target, centred, pointing down', () => {
    const arrow = arrowPlacement(target);
    expect(arrow.points).toBe('down');
    expect(arrow.x + 17).toBe(450);
    expect(arrow.y + 34).toBe(300 - SPOT_PADDING);
  });

  it('puts the arrow below targets near the top of the screen, pointing up', () => {
    const arrow = arrowPlacement({ x: 20, y: 12, w: 140, h: 40 });
    expect(arrow.points).toBe('up');
    expect(arrow.y).toBe(12 - SPOT_PADDING + 40 + SPOT_PADDING * 2);
  });
});
