import { ZERO, type Num } from '@/core/numbers';
import type { Rng } from '@/core/rng';
import type { DrinkBonus } from './bonus';

/** The tip a lucky drink brings: by chance, a share of the price in whole coins (at least 1). Zero otherwise. */
export function rollTip(price: Num, bonus: Pick<DrinkBonus, 'tipChance' | 'tipShare'>, rng: Rng): Num {
  // No roll without a chance, so drinks without luck use no randomness.
  if (bonus.tipChance <= 0 || rng() >= bonus.tipChance) return ZERO;
  return tipSize(price, bonus);
}

/** What a tip is worth when it comes. */
export const tipSize = (price: Num, bonus: Pick<DrinkBonus, 'tipShare'>): Num => price.mul(bonus.tipShare).round().max(1);
