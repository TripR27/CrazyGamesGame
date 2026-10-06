/** Aliases the guide resolves to a concrete target while playing (see systems/tutorial/guide.ts). */
export const GUIDE_TARGETS = ['guide-ingredient', 'guide-customer', 'guide-upgrade', 'guide-staff', 'guide-seats', 'guide-liked', 'guide-vip'] as const;

/** Targets registered by the scene and the HUD under a fixed id. */
export const FIXED_TARGETS = ['cauldron', 'hud-gold', 'shop-button'] as const;

export const KNOWN_TARGETS: readonly string[] = [...GUIDE_TARGETS, ...FIXED_TARGETS];
