/** Aliases the guide resolves to a concrete target while playing (see systems/tutorial/guide.ts). */
export const GUIDE_TARGETS = [
  'guide-ingredient', 'guide-drink', 'guide-customer', 'guide-shop', 'guide-book',
  'guide-upgrade', 'guide-staff', 'guide-seats', 'guide-liked', 'guide-vip', 'guide-ingredient-buy', 'guide-new-ingredient',
  'guide-room-buy', 'guide-new-room',
] as const;

/** Targets registered by the scene and the HUD under a fixed id. */
export const FIXED_TARGETS = ['cauldron', 'hud-gold', 'panel-button', 'book-panel'] as const;

export const KNOWN_TARGETS: readonly string[] = [...GUIDE_TARGETS, ...FIXED_TARGETS];
