import { describe, expect, it, vi } from 'vitest';
import { recipes, rng, station, ab, cde } from './fixtures';
import { addIngredient, advanceBrewing, brewProgress, emptyCauldron, startBrewSystem, canGrow, matchRecipe } from '@/brewing/brewing';
import { ingredients, buyIngredient, firstBuyableIngredient, ingredientOffer, type IngredientShopState, ownedIngredients, watchIngredientShop } from '@/brewing/ingredients';
import { recipes as allRecipes } from '@/recipes/recipe-data';
import { createEventBus, type GameEvents } from '@/shared/events';
import { num } from '@/shared/numbers';
import { createStore } from '@/shared/state';

function brewing() {
  const s = station();
  addIngredient(s, 'a', recipes, rng());
  addIngredient(s, 'b', recipes, rng());
  return s;
}

describe('brew timer', () => {
  it('shows progress and keeps the drink in the cauldron until the time is up', () => {
    const s = brewing();
    expect(brewProgress(s)).toBe(0);
    expect(advanceBrewing(s, 500)).toEqual([]);
    expect(brewProgress(s)).toBeCloseTo(0.25, 5);
    expect(s.ready).toEqual([]);
  });

  it('puts the finished drink on the bar and frees the cauldron', () => {
    const s = brewing();
    expect(advanceBrewing(s, 2000)).toEqual([{ kind: 'done', recipeId: 'ab' }]);
    expect(s.ready).toEqual(['ab']);
    expect(s.brewing).toBeNull();
    expect(brewProgress(s)).toBe(0);
  });

  it('does nothing when idle', () => {
    expect(advanceBrewing(station(), 1000)).toEqual([]);
  });

  it('is driven by the game tick and announces the result on the bus', () => {
    const bus = createEventBus<GameEvents>();
    const s = brewing();
    const done = vi.fn();
    bus.on('brew:done', done);
    const stop = startBrewSystem(s, bus);
    for (let t = 0; t < 2000; t += 100) bus.emit('tick', { deltaMs: 100 });
    expect(done).toHaveBeenCalledWith({ recipeId: 'ab' });
    stop();
    s.brewing = { recipeId: 'ab', remainingMs: 100, totalMs: 100 };
    bus.emit('tick', { deltaMs: 100 });
    expect(done).toHaveBeenCalledTimes(1);
  });
});

describe('emptying the cauldron', () => {
  it('throws away the contents, but not while brewing', () => {
    const s = station();
    addIngredient(s, 'c', recipes, rng());
    expect(emptyCauldron(s)).toBe(true);
    expect(s.contents).toEqual([]);
    expect(emptyCauldron(s)).toBe(false);

    const b = brewing();
    expect(emptyCauldron(b)).toBe(false);
    expect(b.brewing).not.toBeNull();
  });
});

describe('matching ingredients to recipes', () => {
  it('matches the exact set in any order', () => {
    expect(matchRecipe(['a', 'b'], recipes)).toBe(ab);
    expect(matchRecipe(['b', 'a'], recipes)).toBe(ab);
    expect(matchRecipe(['e', 'c', 'd'], recipes)).toBe(cde);
  });

  it('does not match partial, extra or duplicate sets', () => {
    expect(matchRecipe(['a'], recipes)).toBeUndefined();
    expect(matchRecipe(['a', 'b', 'c'], recipes)).toBeUndefined();
    expect(matchRecipe(['a', 'a'], recipes)).toBeUndefined();
  });

  it('knows whether a combination can still grow into a recipe', () => {
    expect(canGrow(['c'], recipes)).toBe(true);
    expect(canGrow(['c', 'd'], recipes)).toBe(true);
    expect(canGrow(['a', 'c'], recipes)).toBe(false);
    expect(canGrow(['a', 'a'], recipes)).toBe(false);
    expect(canGrow(['z'], recipes)).toBe(false);
  });
});

describe('adding an ingredient', () => {
  it('waits quietly while the combination is incomplete', () => {
    const s = station();
    expect(addIngredient(s, 'c', recipes, rng())).toEqual([]);
    expect(addIngredient(s, 'd', recipes, rng())).toEqual([]);
    expect(s.contents).toEqual(['c', 'd']);
  });

  it('starts brewing the moment a known recipe is complete, whatever the order', () => {
    const s = station();
    addIngredient(s, 'b', recipes, rng());
    expect(addIngredient(s, 'a', recipes, rng())).toEqual([{ kind: 'started', recipeId: 'ab' }]);
    expect(s.contents).toEqual([]);
    expect(s.brewing).toEqual({ recipeId: 'ab', remainingMs: 2000, totalMs: 2000 });
  });

  it('starts a three-ingredient recipe on the third ingredient', () => {
    const s = station();
    for (const id of ['c', 'd']) addIngredient(s, id, recipes, rng());
    expect(addIngredient(s, 'e', recipes, rng())).toEqual([{ kind: 'started', recipeId: 'cde' }]);
  });

  it('fizzles at once when the combination cannot become a recipe', () => {
    const s = station();
    addIngredient(s, 'a', recipes, rng());
    const events = addIngredient(s, 'c', recipes, rng());
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({ kind: 'notice', notice: 'fizzle' });
    expect(s.contents).toEqual([]);
    expect(s.brewing).toBeNull();
  });

  it('fizzles on a repeated ingredient and on an ingredient no recipe uses', () => {
    const s = station();
    addIngredient(s, 'a', recipes, rng());
    expect(addIngredient(s, 'a', recipes, rng())[0]).toMatchObject({ notice: 'fizzle' });
    expect(addIngredient(s, 'zzz', recipes, rng())[0]).toMatchObject({ notice: 'fizzle' });
  });

  it('only brews recipes the player knows', () => {
    const s = station();
    addIngredient(s, 'a', [], rng());
    expect(s.brewing).toBeNull();
    expect(s.contents).toEqual([]);
  });

  it('says the cauldron is busy while brewing and leaves everything as it was', () => {
    const s = station();
    addIngredient(s, 'a', recipes, rng());
    addIngredient(s, 'b', recipes, rng());
    const events = addIngredient(s, 'c', recipes, rng());
    expect(events[0]).toMatchObject({ kind: 'notice', notice: 'busy' });
    expect(s.brewing?.recipeId).toBe('ab');
    expect(s.contents).toEqual([]);
  });

  it('says the bar is full when there is no room for another drink', () => {
    const s = station(2);
    s.ready.push('ab', 'ab');
    const events = addIngredient(s, 'a', recipes, rng());
    expect(events[0]).toMatchObject({ kind: 'notice', notice: 'full' });
    expect(s.contents).toEqual([]);
  });

  it('uses a message line from the matching feedback pool', () => {
    const s = station();
    addIngredient(s, 'a', recipes, rng());
    const [event] = addIngredient(s, 'c', recipes, rng());
    expect(event).toMatchObject({ messageKey: expect.stringMatching(/^feedback\.fizzle\.[1-3]$/) });
  });
});

const catalog = { ingredients, recipes: allRecipes };
const pepper = ingredients.find((i) => i.id === 'fire_pepper');
const state = (over: Partial<IngredientShopState> = {}): IngredientShopState => ({
  reputation: 0, currencies: { gold: num(0) }, ingredientsBought: [], recipesDiscovered: ['slime_sap', 'glowcap_stout'], ...over,
});
const owned = (s: IngredientShopState): string[] => ownedIngredients(s, ingredients, allRecipes).map((i) => i.id);

describe('owned ingredients', () => {
  it('are the basic ones at the start, plus what was bought', () => {
    expect(owned(state())).toEqual(['swamp_slime', 'wild_honey', 'glowcap']);
    expect(owned(state({ ingredientsBought: ['moon_grape'] }))).toEqual(['swamp_slime', 'wild_honey', 'glowcap', 'moon_grape']);
  });

  it('include what a known recipe uses, so an older save keeps brewing its drinks', () => {
    expect(owned(state({ recipesDiscovered: ['dragons_hiccup'] }))).toContain('fire_pepper');
  });
});

describe('the ingredient shop', () => {
  it('opens an ingredient at its level, sells it, and then it is owned', () => {
    if (pepper === undefined) throw new Error('fire_pepper missing');
    expect(ingredientOffer(state({ currencies: { gold: num(999) } }), pepper, catalog).status).toBe('locked');
    const open = state({ reputation: 10, currencies: { gold: num(39) } });
    expect(ingredientOffer(open, pepper, catalog)).toMatchObject({ status: 'forSale', affordable: false });
    expect(firstBuyableIngredient(open, catalog)).toBeUndefined();
    open.currencies.gold = num(40);
    expect(firstBuyableIngredient(open, catalog)?.id).toBe('fire_pepper');
  });

  it('takes the gold once and never sells the same ingredient twice', () => {
    if (pepper === undefined) throw new Error('fire_pepper missing');
    const store = createStore(state({ reputation: 10, currencies: { gold: num(100) } }));
    expect(buyIngredient(store, pepper, catalog)).toBe(true);
    expect(buyIngredient(store, pepper, catalog)).toBe(false);
    expect(store.getState().currencies.gold.toNumber()).toBe(60);
    expect(store.getState().ingredientsBought).toEqual(['fire_pepper']);
    expect(ingredientOffer(store.getState(), pepper, catalog).status).toBe('owned');
  });

  it('announces when an ingredient becomes buyable (a new level or enough gold)', () => {
    const store = createStore(state({ currencies: { gold: num(100) } }));
    const bus = createEventBus<GameEvents>();
    const seen = vi.fn();
    bus.on('ingredients:affordable', seen);
    watchIngredientShop(store, bus, catalog);
    store.update((s) => void (s.reputation = 10));
    store.update((s) => void (s.reputation = 11));
    expect(seen).toHaveBeenCalledTimes(1);
  });
});
