/**
 * Placeholder numbers for drink effects; tuned in step 13. Every effect always works; when the customer likes
 * the effect it counts `likedFactor` times as strong.
 */
export const EFFECT_POWER = {
  likedFactor: 2,
  /** Strength: the customer pays this fraction more. */
  strengthExtraPrice: 0.25,
  /** Speed: drinking takes this fraction less time, so the seat frees up sooner. */
  speedDrinkCut: 0.4,
  /** Luck: the chance of a tip (liked: higher chance), and the tip as a fraction of the price. */
  luckTipChance: 0.25,
  luckTipShare: 0.5,
  /** Charm: reputation on top of the normal reputation per serve. */
  charmExtraReputation: 1,
} as const;

/** A customer orders a drink they like this many times as often as another known drink. */
export const LIKED_ORDER_WEIGHT = 2;
