import type { World } from '@/app/world';
import type { RecipeDef } from '@/recipes/recipe-data';
import type { OneTimePurchase, Rarity } from '@/shared/content';
import type { EventBus, GameEvents } from '@/shared/events';
import type { Num } from '@/shared/numbers';
import { oneTimeOffer, type OneTimeOffer, watchBuyable, type WatchSource } from '@/shared/purchases';

export type IngredientId = string;

/** Where an ingredient comes from: bought in the shop, or found by heroes in a dungeon (a stock that runs out). */
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

/** Found by heroes in the swamp (heroes/heroes.ts), never bought: every drink with one uses one up. */
export const dungeonIngredients: readonly IngredientDef[] = [
  { id: 'bog_pearl', tier: 3, rarity: 'rare', source: 'dungeon:swamp' },
  { id: 'witch_moss', tier: 3, rarity: 'rare', source: 'dungeon:swamp' },
];

/** New tier = new file + one spread here. */
export const ingredients: readonly IngredientDef[] = [...tier01Ingredients, ...tier02Ingredients, ...dungeonIngredients];

/** What owning ingredients depends on (interface segregation: not the whole state). */
export interface IngredientState {
  ingredientsBought: readonly string[];
  recipesDiscovered: readonly string[];
  /** Dungeon ingredients held; an id that is in here was found at least once. */
  ingredientStock: Readonly<Record<string, number>>;
}

/** A shop ingredient that is on the shelf from the start (nothing to buy). */
export const isBasic = (def: IngredientDef): boolean => def.source === 'shop' && def.buy === undefined;

/** A dungeon ingredient: heroes find it, and it is used up. */
export const isDungeon = (def: IngredientDef): boolean => def.source !== 'shop';

/**
 * The ingredients the player has, in content order: the basic ones, the bought ones, the dungeon ones found at least
 * once (also when the stock is empty: the shelf shows them greyed out), and everything a known recipe uses (a known
 * recipe was brewed, so its ingredients were there; this also keeps older saves brewable).
 */
export function ownedIngredients(
  state: IngredientState,
  ingredients: readonly IngredientDef[],
  recipes: readonly RecipeDef[],
): IngredientDef[] {
  const used = new Set(recipes.filter((r) => state.recipesDiscovered.includes(r.id)).flatMap((r) => r.ingredients));
  return ingredients.filter((i) => isBasic(i) || state.ingredientsBought.includes(i.id) || used.has(i.id) || (isDungeon(i) && i.id in state.ingredientStock));
}

/** How many of a dungeon ingredient the player holds. */
export const stockOf = (state: Pick<IngredientState, 'ingredientStock'>, id: string): number => state.ingredientStock[id] ?? 0;

/** True for an ingredient id that is a dungeon ingredient in this catalogue. */
export const isStocked = (ingredients: readonly IngredientDef[], id: string): boolean => ingredients.some((i) => i.id === id && isDungeon(i));

/** True when the recipe needs a dungeon ingredient (it can only be brewed while there is stock). */
export const usesStock = (recipe: RecipeDef, ingredients: readonly IngredientDef[]): boolean => recipe.ingredients.some((id) => isStocked(ingredients, id));

/** True when every dungeon ingredient of the recipe is in stock at least `need` times. */
function covered(state: Pick<IngredientState, 'ingredientStock'>, recipe: RecipeDef, ingredients: readonly IngredientDef[], need: (id: string) => number): boolean {
  return recipe.ingredients.every((id) => !isStocked(ingredients, id) || stockOf(state, id) >= need(id));
}

/** The known recipes that can be brewed now: those with a dungeon ingredient only while it is in stock. */
export function brewableRecipes(state: IngredientState, catalog: IngredientCatalog): RecipeDef[] {
  return catalog.recipes.filter((r) => state.recipesDiscovered.includes(r.id) && covered(state, r, catalog.ingredients, () => 1));
}

const hasAnyStock = (stock: Readonly<Record<string, number>>): boolean => {
  for (const id in stock) if ((stock[id] ?? 0) > 0) return true;
  return false;
};

/**
 * The known recipes a new customer may order. A recipe with a dungeon ingredient only when the stock covers it on top
 * of the orders already waiting for drinks with that ingredient, so the stock is not promised twice. Without any
 * dungeon stock this is simply the known recipes (no work on every tick).
 */
export function orderableRecipeIds(state: IngredientState, catalog: IngredientCatalog, waiting: readonly { recipeId: string }[]): readonly string[] {
  if (!hasAnyStock(state.ingredientStock)) {
    return catalog.recipes.some((r) => usesStock(r, catalog.ingredients) && state.recipesDiscovered.includes(r.id))
      ? brewableRecipes(state, catalog).map((r) => r.id)
      : state.recipesDiscovered;
  }
  const promised = (id: string): number =>
    waiting.filter((c) => catalog.recipes.find((r) => r.id === c.recipeId)?.ingredients.includes(id) === true).length;
  return catalog.recipes
    .filter((r) => state.recipesDiscovered.includes(r.id) && covered(state, r, catalog.ingredients, (id) => promised(id) + 1))
    .map((r) => r.id);
}

/** Uses up the dungeon ingredients of every drink that starts brewing (by the player or the brewer). Returns a stop function. */
export function watchStockUse({ store, bus, content }: Pick<World, 'store' | 'bus' | 'content'>): () => void {
  const use = ({ recipeId }: { recipeId: string }): void => {
    const recipe = content.recipes.find((r) => r.id === recipeId);
    if (recipe === undefined || !usesStock(recipe, content.ingredients)) return;
    store.update((s) => {
      for (const id of recipe.ingredients) if (isStocked(content.ingredients, id)) s.ingredientStock[id] = Math.max(0, stockOf(s, id) - 1);
    });
    bus.emit('saveRequested', {});
  };
  const stops = [bus.on('brew:started', use), bus.on('brewer:started', use)];
  return () => stops.forEach((stop) => stop());
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

/** Ingredient ids on the shelf: the basic ones, what the player bought and the dungeon ones found (read every frame by the scene). */
export function shelfIds({ store, content }: Pick<World, 'store' | 'content'>): readonly string[] {
  return ownedIngredients(store.getState(), content.ingredients, content.recipes).map((i) => i.id);
}

/** The shelf without the dungeon ingredients that ran out: what can go into the cauldron right now. */
export function usableIngredientIds(world: Pick<World, 'store' | 'content'>): readonly string[] {
  const state = world.store.getState();
  return shelfIds(world).filter((id) => !isStocked(world.content.ingredients, id) || stockOf(state, id) > 0);
}

/** The count on a shelf ingredient: the stock of a dungeon ingredient, or null for a shop one (never runs out). */
export function shelfCount({ store, content }: Pick<World, 'store' | 'content'>, id: string): number | null {
  return isStocked(content.ingredients, id) ? stockOf(store.getState(), id) : null;
}

/** Buy an ingredient in the shop (one time); does nothing when it is locked, owned or too expensive. */
export function buyIngredientById({ bus, store, content }: Pick<World, 'bus' | 'store' | 'content'>, id: string): void {
  const def = content.ingredients.find((i) => i.id === id);
  if (def === undefined || !buyIngredient(store, def, content)) return;
  bus.emit('ingredient:bought', { id: def.id });
  bus.emit('saveRequested', {});
}
