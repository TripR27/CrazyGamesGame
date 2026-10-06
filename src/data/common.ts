export const RARITIES = ['common', 'uncommon', 'rare', 'epic', 'legendary'] as const;
export type Rarity = (typeof RARITIES)[number];

/** What a drink does to the customer; customers list the effects they like. */
export const EFFECTS = ['strength', 'speed', 'luck', 'charm'] as const;
export type Effect = (typeof EFFECTS)[number];
