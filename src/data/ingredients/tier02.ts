import type { IngredientDef } from './types';

/**
 * Each tier-2 ingredient is bought once in the shop, one per level, so a new level brings one new thing to try.
 * The recipes a level unlocks (data/reputation/levels.ts) only need what is buyable by then. Placeholder prices.
 */
export const tier02Ingredients: readonly IngredientDef[] = [
  { id: 'fire_pepper', tier: 2, rarity: 'uncommon', source: 'shop', buy: { level: 2, cost: 40 } },
  { id: 'moon_grape', tier: 2, rarity: 'uncommon', source: 'shop', buy: { level: 3, cost: 150 } },
  { id: 'troll_sweat', tier: 2, rarity: 'uncommon', source: 'shop', buy: { level: 4, cost: 600 } },
];
