import type { RecipeDef } from './types';

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
];
