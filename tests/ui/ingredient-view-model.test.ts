import { describe, expect, it } from 'vitest';
import { num } from '@/core/numbers';
import { ingredients } from '@/data/ingredients';
import { recipes } from '@/data/recipes';
import type { IngredientShopState } from '@/systems/ingredients';
import { toBookView } from '@/ui/recipe-book/book-view-model';
import { isListed, toIngredientRowView } from '@/ui/shop/ingredient-view-model';

const catalog = { ingredients, recipes };
const grape = ingredients.find((i) => i.id === 'moon_grape') ?? ingredients[0];
const state = (reputation: number, gold: number, bought: string[] = []): IngredientShopState => ({
  reputation, currencies: { gold: num(gold) }, ingredientsBought: bought, recipesDiscovered: ['slime_sap'],
});

describe('an ingredient in the shop', () => {
  it('shows the level that opens it, then its price, then that it is on the shelf', () => {
    if (grape === undefined) throw new Error('no ingredients');
    expect(toIngredientRowView(grape, state(0, 999), catalog)).toMatchObject({
      name: 'Moon Grape', level: 'Unlocks at Cozy Inn', buyLabel: 'Buy · 150', canBuy: false, maxed: false,
    });
    expect(toIngredientRowView(grape, state(40, 150), catalog)).toMatchObject({ level: '', canBuy: true });
  });

  it('leaves the shop once it is bought, but is listed while locked or for sale', () => {
    if (grape === undefined) throw new Error('no ingredients');
    expect(isListed(grape, state(0, 0), catalog)).toBe(true);
    expect(isListed(grape, state(40, 0), catalog)).toBe(true);
    expect(isListed(grape, state(40, 0, ['moon_grape']), catalog)).toBe(false);
  });
});

describe('the recipe book and the ingredient shop', () => {
  it('tells which shop ingredient a discoverable recipe still needs', () => {
    const book = (bought: string[]) => toBookView({ recipesDiscovered: [], reputation: 10, ingredientsBought: bought }, recipes);
    const hiccup = (bought: string[]) => book(bought).entries.find((e) => e.id === 'dragons_hiccup');
    expect(hiccup([])).toMatchObject({ kind: 'hidden', needs: 'Needs Fire Pepper from the shop' });
    expect(hiccup(['fire_pepper'])).not.toHaveProperty('needs');
    expect(book([]).entries.find((e) => e.id === 'bog_lantern')).not.toHaveProperty('needs');
  });
});
