import { type RecipeDef, recipes } from '@/recipes/recipe-data';
import { discoverableRecipes } from '@/recipes/recipes';
import type { OneTimePurchase, Rarity } from '@/shared/content';
import type { EventBus, GameEvents } from '@/shared/events';
import type { Num } from '@/shared/numbers';
import { oneTimeOffer, type OneTimeOffer, watchBuyable, type WatchSource } from '@/shared/purchases';
import type { GameState, Store } from '@/shared/state';

export type IngredientId = string;

/** Where an ingredient comes from: bought in the shop, or dropped by a dungeon (step 16). */
export type IngredientSource = 'shop' | `dungeon:${string}`;

/** A one-time purchase in the shop: from reputation `level` on, for `cost` gold. Using it stays free. */
export type IngredientPurchase = OneTimePurchase;

/** A shop ingredient without `buy` is on the shelf from the start. */
export interface IngredientDef {
  id: IngredientId;
  tier: number;
  rarity: Rarity;
  source: IngredientSource;
  buy?: IngredientPurchase;
}

export const tier01Ingredients: readonly IngredientDef[] = [
  { id: 'swamp_slime', tier: 1, rarity: 'common', source: 'shop' },
  { id: 'wild_honey', tier: 1, rarity: 'common', source: 'shop' },
  { id: 'glowcap', tier: 1, rarity: 'common', source: 'shop' },
];

/**
 * Each tier-2 ingredient is bought once in the shop, one per level, so a new level brings one new thing to try.
 * The recipes a level unlocks (data/reputation/levels.ts) only need what is buyable by then. Placeholder prices.
 */
export const tier02Ingredients: readonly IngredientDef[] = [
  { id: 'fire_pepper', tier: 2, rarity: 'uncommon', source: 'shop', buy: { level: 2, cost: 40 } },
  { id: 'moon_grape', tier: 2, rarity: 'uncommon', source: 'shop', buy: { level: 3, cost: 150 } },
  { id: 'troll_sweat', tier: 2, rarity: 'uncommon', source: 'shop', buy: { level: 4, cost: 600 } },
];

/** New tier = new file + one spread here. */
export const ingredients: readonly IngredientDef[] = [...tier01Ingredients, ...tier02Ingredients];

/** What owning ingredients depends on (interface segregation: not the whole state). */
export interface IngredientState {
  ingredientsBought: readonly string[];
  recipesDiscovered: readonly string[];
}

/** A shop ingredient that is on the shelf from the start (nothing to buy). */
export const isBasic = (def: IngredientDef): boolean => def.source === 'shop' && def.buy === undefined;

/**
 * The ingredients the player has, in content order: the basic ones, the bought ones, and everything a known recipe
 * uses (a known recipe was brewed, so its ingredients were there; this also keeps older saves brewable).
 */
export function ownedIngredients(
  state: IngredientState,
  ingredients: readonly IngredientDef[],
  recipes: readonly RecipeDef[],
): IngredientDef[] {
  const used = new Set(recipes.filter((r) => state.recipesDiscovered.includes(r.id)).flatMap((r) => r.ingredients));
  return ingredients.filter((i) => isBasic(i) || state.ingredientsBought.includes(i.id) || used.has(i.id));
}

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

export type IngredientOffer = OneTimeOffer;

/** The catalogue the shop works with; passed in so tests and the simulator can use their own. */
export interface IngredientCatalog {
  ingredients: readonly IngredientDef[];
  recipes: readonly RecipeDef[];
}

export function ingredientOffer(state: IngredientShopState, def: IngredientDef, catalog: IngredientCatalog): IngredientOffer {
  const owned = ownedIngredients(state, catalog.ingredients, catalog.recipes).some((i) => i.id === def.id);
  return oneTimeOffer(def.buy, owned, state);
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

/** Publishes `ingredients:affordable` each time an ingredient becomes buyable. Returns a stop function. */
export function watchIngredientShop(source: WatchSource<IngredientShopState>, bus: EventBus<GameEvents>, catalog: IngredientCatalog): () => void {
  return watchBuyable(source, bus, (state) => firstBuyableIngredient(state, catalog) !== undefined, 'ingredients:affordable');
}

export interface IngredientShelf {
  catalog: IngredientCatalog;
  /** Ingredient ids on the shelf: the basic ones plus what the player bought (read every frame by the scene). */
  getShelf(): readonly string[];
  /** Recipes the player could discover now: level reached and every ingredient on the shelf. */
  getDiscoverable(): readonly RecipeDef[];
}

/** What the player has to brew with, read fresh from the state each time. */
export function createIngredientShelf(store: Store<GameState>): IngredientShelf {
  const catalog: IngredientCatalog = { ingredients, recipes };
  const getShelf = (): readonly string[] => ownedIngredients(store.getState(), ingredients, recipes).map((i) => i.id);
  return {
    catalog,
    getShelf,
    getDiscoverable: () => discoverableRecipes(store.getState(), recipes, getShelf()),
  };
}

export interface IngredientActions {
  /** Buy an ingredient in the shop (one time); does nothing when it is locked, owned or too expensive. */
  buyIngredient(ingredientId: string): void;
}

export interface IngredientActionDeps {
  bus: EventBus<GameEvents>;
  store: IngredientShopStore;
  catalog: IngredientCatalog;
}

export function createIngredientActions({ bus, store, catalog }: IngredientActionDeps): IngredientActions {
  return {
    buyIngredient(ingredientId) {
      const def = catalog.ingredients.find((i) => i.id === ingredientId);
      if (def === undefined || !buyIngredient(store, def, catalog)) return;
      bus.emit('ingredient:bought', { id: def.id });
      bus.emit('saveRequested', {});
    },
  };
}
