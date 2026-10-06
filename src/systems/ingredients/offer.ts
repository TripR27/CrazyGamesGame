import { num, type Num } from '@/core/numbers';
import type { IngredientDef } from '@/data/ingredients';
import type { RecipeDef } from '@/data/recipes';
import { levelFor } from '@/systems/reputation';
import { ownedIngredients, type IngredientState } from './owned';

/** The part of the state the ingredient shop reads and changes. */
export interface IngredientShopState extends IngredientState {
  reputation: number;
  currencies: { gold: Num };
  ingredientsBought: string[];
}

export interface IngredientShopStore {
  getState(): IngredientShopState;
  update(mutator: (state: IngredientShopState) => void): void;
}

/** How an ingredient stands in the shop: not yet (level too low), for sale, or already on the shelf. */
export type OfferStatus = 'locked' | 'forSale' | 'owned';

export interface IngredientOffer {
  status: OfferStatus;
  cost: Num;
  affordable: boolean;
}

/** The catalogue the shop works with; passed in so tests and the simulator can use their own. */
export interface IngredientCatalog {
  ingredients: readonly IngredientDef[];
  recipes: readonly RecipeDef[];
}

export function ingredientOffer(state: IngredientShopState, def: IngredientDef, catalog: IngredientCatalog): IngredientOffer {
  const cost = num(def.buy?.cost ?? 0);
  if (ownedIngredients(state, catalog.ingredients, catalog.recipes).some((i) => i.id === def.id)) {
    return { status: 'owned', cost, affordable: false };
  }
  const open = def.buy !== undefined && levelFor(state.reputation) >= def.buy.level;
  return { status: open ? 'forSale' : 'locked', cost, affordable: open && state.currencies.gold.gte(cost) };
}

/** The ingredients sold in the shop (all of them, whatever their status), in content order. */
export const shopIngredients = (catalog: IngredientCatalog): IngredientDef[] => catalog.ingredients.filter((i) => i.buy !== undefined);

/** The first ingredient the player can buy right now, or undefined. */
export function firstBuyableIngredient(state: IngredientShopState, catalog: IngredientCatalog): IngredientDef | undefined {
  return shopIngredients(catalog).find((def) => ingredientOffer(state, def, catalog).affordable);
}

/** Buys an ingredient once: pays and puts it on the shelf. Returns false when it cannot be bought. */
export function buyIngredient(store: IngredientShopStore, def: IngredientDef, catalog: IngredientCatalog): boolean {
  const offer = ingredientOffer(store.getState(), def, catalog);
  if (!offer.affordable) return false;
  store.update((state) => {
    state.currencies.gold = state.currencies.gold.sub(offer.cost);
    state.ingredientsBought.push(def.id);
  });
  return true;
}
