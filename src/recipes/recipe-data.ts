import type { IngredientId } from '@/brewing/ingredients';
import type { Effect, Rarity } from '@/shared/content';

export type RecipeId = string;

/** Two or three different ingredients; the combination is what the player discovers. */
export type RecipeIngredients =
  | readonly [IngredientId, IngredientId]
  | readonly [IngredientId, IngredientId, IngredientId];

/** Name and discovery hint are i18n texts: `recipes.<id>.name` and `recipes.<id>.hint`. */
export interface RecipeDef {
  id: RecipeId;
  tier: number;
  rarity: Rarity;
  ingredients: RecipeIngredients;
  brewSeconds: number;
  basePrice: number;
  effect: Effect;
}

/** Recipes a new player already knows. The rest are discovered by combining ingredients (step 12). */
export const STARTER_RECIPE_IDS: readonly string[] = ['slime_sap', 'glowcap_stout'];

export const tier01Recipes: readonly RecipeDef[] = [
  {
    id: 'slime_sap',
    tier: 1,
    rarity: 'common',
    ingredients: ['swamp_slime', 'wild_honey'],
    brewSeconds: 4,
    basePrice: 8,
    effect: 'charm',
  },
  {
    id: 'glowcap_stout',
    tier: 1,
    rarity: 'common',
    ingredients: ['glowcap', 'wild_honey'],
    brewSeconds: 5,
    basePrice: 12,
    effect: 'speed',
  },
  {
    id: 'bog_lantern',
    tier: 1,
    rarity: 'common',
    ingredients: ['swamp_slime', 'glowcap'],
    brewSeconds: 6,
    basePrice: 15,
    effect: 'luck',
  },
];

export const tier02Recipes: readonly RecipeDef[] = [
  {
    id: 'dragons_hiccup',
    tier: 2,
    rarity: 'uncommon',
    ingredients: ['fire_pepper', 'wild_honey'],
    brewSeconds: 8,
    basePrice: 30,
    effect: 'strength',
  },
  {
    id: 'moonlight_merlot',
    tier: 2,
    rarity: 'uncommon',
    ingredients: ['moon_grape', 'glowcap'],
    brewSeconds: 10,
    basePrice: 45,
    effect: 'charm',
  },
  {
    id: 'trolls_toll',
    tier: 2,
    rarity: 'uncommon',
    ingredients: ['troll_sweat', 'moon_grape', 'swamp_slime'],
    brewSeconds: 12,
    basePrice: 60,
    effect: 'luck',
  },
  {
    id: 'swamp_fire',
    tier: 2,
    rarity: 'uncommon',
    ingredients: ['fire_pepper', 'swamp_slime'],
    brewSeconds: 8,
    basePrice: 35,
    effect: 'speed',
  },
  {
    id: 'honeyed_moon',
    tier: 2,
    rarity: 'uncommon',
    ingredients: ['moon_grape', 'wild_honey'],
    brewSeconds: 9,
    basePrice: 40,
    effect: 'charm',
  },
  {
    id: 'gym_sock_mead',
    tier: 2,
    rarity: 'uncommon',
    ingredients: ['troll_sweat', 'wild_honey'],
    brewSeconds: 9,
    basePrice: 38,
    effect: 'strength',
  },
  {
    id: 'spicy_spores',
    tier: 2,
    rarity: 'uncommon',
    ingredients: ['fire_pepper', 'glowcap'],
    brewSeconds: 9,
    basePrice: 42,
    effect: 'luck',
  },
  {
    id: 'troll_torch',
    tier: 2,
    rarity: 'uncommon',
    ingredients: ['troll_sweat', 'glowcap'],
    brewSeconds: 10,
    basePrice: 50,
    effect: 'strength',
  },
];

/** The rarer tier-2 drinks: slower to brew, worth a lot more. */
export const tier02RareRecipes: readonly RecipeDef[] = [
  {
    id: 'dusk_sangria',
    tier: 2,
    rarity: 'rare',
    ingredients: ['fire_pepper', 'moon_grape'],
    brewSeconds: 12,
    basePrice: 75,
    effect: 'charm',
  },
  {
    id: 'berserker_brew',
    tier: 2,
    rarity: 'rare',
    ingredients: ['fire_pepper', 'troll_sweat'],
    brewSeconds: 13,
    basePrice: 85,
    effect: 'strength',
  },
];

/** New tier = new file + one spread here. */
export const recipes: readonly RecipeDef[] = [...tier01Recipes, ...tier02Recipes, ...tier02RareRecipes];
