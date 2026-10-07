export const RARITIES = ['common', 'uncommon', 'rare', 'epic', 'legendary'] as const;
export type Rarity = (typeof RARITIES)[number];

/** What a drink does to the customer; customers list the effects they like. */
export const EFFECTS = ['strength', 'speed', 'luck', 'charm'] as const;
export type Effect = (typeof EFFECTS)[number];

/** Something bought once in the shop: for sale from reputation `level` on, for `cost` gold (ingredients, rooms, decorations). */
export interface OneTimePurchase {
  level: number;
  cost: number;
}

export type ContentDomain = 'ingredients' | 'recipes' | 'customers' | 'upgrades' | 'feedback' | 'tutorial' | 'reputation' | 'rooms' | 'decor';

/** Content data holds ids only; every visible string lives in i18n under `domain.id.field`. */
export function textKey(domain: ContentDomain, id: string, field: string): string {
  return `${domain}.${id}.${field}`;
}
