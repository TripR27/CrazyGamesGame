import type { RecipeDef } from '@/data/recipes/types';

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
