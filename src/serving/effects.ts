import type { CustomerDef } from '@/customers/customer-data';
import { t } from '@/i18n/translator';
import type { RecipeDef } from '@/recipes/recipe-data';
import { EFFECTS, type Effect } from '@/shared/content';
import { ZERO, type Num } from '@/shared/numbers';
import type { Rng } from '@/shared/random';

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

/** What a served drink does for this customer. The neutral values mean "no change". */
export interface DrinkBonus {
  /** The price is multiplied by this (strength). */
  priceFactor: number;
  /** Chance of a tip, 0 to 1 (luck). */
  tipChance: number;
  /** A tip is this fraction of the price. */
  tipShare: number;
  /** Reputation on top of the normal reputation per serve (charm). */
  extraReputation: number;
  /** Drinking time is multiplied by this (speed). */
  drinkTimeFactor: number;
}

const NEUTRAL: DrinkBonus = {
  priceFactor: 1,
  tipChance: 0,
  tipShare: EFFECT_POWER.luckTipShare,
  extraReputation: 0,
  drinkTimeFactor: 1,
};

/** One rule per effect (a new effect is one more entry). `power` is 1, or `likedFactor` when the customer likes it. */
const RULES: Readonly<Record<Effect, (power: number) => Partial<DrinkBonus>>> = {
  strength: (power) => ({ priceFactor: 1 + EFFECT_POWER.strengthExtraPrice * power }),
  speed: (power) => ({ drinkTimeFactor: Math.max(0, 1 - EFFECT_POWER.speedDrinkCut * power) }),
  luck: (power) => ({ tipChance: Math.min(1, EFFECT_POWER.luckTipChance * power) }),
  charm: (power) => ({ extraReputation: EFFECT_POWER.charmExtraReputation * power }),
};

type Likes = Pick<CustomerDef, 'likes'>;
type HasEffect = Pick<RecipeDef, 'effect'>;

/** The customer likes what this drink does. */
export const isLiked = (type: Likes, recipe: HasEffect): boolean => type.likes.includes(recipe.effect);

/** The effect of a drink always works; a liked effect counts double (`EFFECT_POWER.likedFactor`). */
export function drinkBonus(recipe: HasEffect, type: Likes): DrinkBonus {
  const power = isLiked(type, recipe) ? EFFECT_POWER.likedFactor : 1;
  return { ...NEUTRAL, ...RULES[recipe.effect](power) };
}

/** How often a customer orders this drink compared with another: liked drinks come up more often. */
export const orderWeight = (type: Likes, recipe: HasEffect): number => (isLiked(type, recipe) ? LIKED_ORDER_WEIGHT : 1);

/** The tip a lucky drink brings: by chance, a share of the price in whole coins (at least 1). Zero otherwise. */
export function rollTip(price: Num, bonus: Pick<DrinkBonus, 'tipChance' | 'tipShare'>, rng: Rng): Num {
  // No roll without a chance, so drinks without luck use no randomness.
  if (bonus.tipChance <= 0 || rng() >= bonus.tipChance) return ZERO;
  return tipSize(price, bonus);
}

/** What a tip is worth when it comes. */
export const tipSize = (price: Num, bonus: Pick<DrinkBonus, 'tipShare'>): Num => price.mul(bonus.tipShare).round().max(1);

/** The icon of a drink effect (an emoji placeholder until the art pass). */
export const effectIcon = (effect: Effect): string => t(`effects.${effect}.icon`);

/** A text with the effect's icon in front, e.g. "⚡ speed". */
export const withEffectIcon = (effect: Effect, text: string): string =>
  t('effects.with_icon', { icon: effectIcon(effect), text });

/** One line of the effect legend in the recipe book: the icon, the name and what it does. */
export interface EffectLegendLine {
  effect: Effect;
  icon: string;
  name: string;
  does: string;
}

/** The legend at the top of the recipe book, one line per effect; recipe cards then show only the icon. */
export const effectLegend = (): EffectLegendLine[] =>
  EFFECTS.map((effect) => ({ effect, icon: effectIcon(effect), name: t(`effects.${effect}.name`), does: t(`effects.${effect}.does`) }));

/** Numbers for serving a drink. */
export const SERVING = {
  reputationPerServe: 1,
  /** A served customer stays this long to drink before the seat frees up (speed drinks make it shorter). */
  drinkMs: 5000,
} as const;
