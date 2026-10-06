import type { Rarity } from '@/data/common';

export type IngredientId = string;

/** Where an ingredient comes from: bought in the shop, or dropped by a dungeon (step 16). */
export type IngredientSource = 'shop' | `dungeon:${string}`;

/** A one-time purchase in the shop: from reputation `level` on, for `cost` gold. Using it stays free. */
export interface IngredientPurchase {
  level: number;
  cost: number;
}

/** A shop ingredient without `buy` is on the shelf from the start. */
export interface IngredientDef {
  id: IngredientId;
  tier: number;
  rarity: Rarity;
  source: IngredientSource;
  buy?: IngredientPurchase;
}
