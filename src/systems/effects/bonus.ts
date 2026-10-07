import type { Effect } from '@/data/common';
import type { CustomerDef } from '@/data/customers/types';
import { EFFECT_POWER, LIKED_ORDER_WEIGHT } from '@/data/effects';
import type { RecipeDef } from '@/data/recipes/types';

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
