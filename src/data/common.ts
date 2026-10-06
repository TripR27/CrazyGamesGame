export const RARITIES = ['common', 'uncommon', 'rare', 'epic', 'legendary'] as const;
export type Rarity = (typeof RARITIES)[number];

/** What a drink does to the customer; customers list the effects they like. */
export const EFFECTS = ['strength', 'speed', 'luck', 'charm'] as const;
export type Effect = (typeof EFFECTS)[number];

/** Something bought once in the shop: for sale from reputation `level` on, for `cost` gold (ingredients, rooms). */
export interface OneTimePurchase {
  level: number;
  cost: number;
}
