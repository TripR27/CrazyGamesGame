import { describe, expect, it, vi } from 'vitest';
import { ingredients } from '@/data/ingredients/index';
import { recipes } from '@/data/recipes/index';
import { createEventBus, type GameEvents } from '@/shared/events';
import { num } from '@/shared/numbers';
import { createStore } from '@/shared/state';
import { buyIngredient, firstBuyableIngredient, ingredientOffer, type IngredientShopState } from '@/systems/ingredients/offer';
import { ownedIngredients } from '@/systems/ingredients/owned';
import { watchIngredientShop } from '@/systems/ingredients/watch';

const catalog = { ingredients, recipes };
const pepper = ingredients.find((i) => i.id === 'fire_pepper');
const state = (over: Partial<IngredientShopState> = {}): IngredientShopState => ({
  reputation: 0, currencies: { gold: num(0) }, ingredientsBought: [], recipesDiscovered: ['slime_sap', 'glowcap_stout'], ...over,
});
const owned = (s: IngredientShopState): string[] => ownedIngredients(s, ingredients, recipes).map((i) => i.id);

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
