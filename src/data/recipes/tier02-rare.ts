import type { RecipeDef } from '@/data/recipes/types';

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
