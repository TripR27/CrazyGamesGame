import type { UpgradeDef } from '@/data/upgrades/types';
import { ZERO, type Num } from '@/shared/numbers';
import { affordableCount, packCost } from '@/systems/upgrades/cost';

/** How many levels the player wants in one click. */
export type BuyAmount = 1 | 10 | 'max';

export interface Quote {
  /** Levels this click would buy; 0 when the upgrade is maxed. */
  count: number;
  /** Price of those levels. */
  cost: Num;
  affordable: boolean;
}

/**
 * What a click would buy and what it costs. A fixed amount is capped at the levels left and is
 * all or nothing; "max" buys as many as the gold allows (or shows the next level if it cannot afford any).
 */
export function quote(def: UpgradeDef, level: number, gold: Num, amount: BuyAmount, left: number): Quote {
  if (left <= 0) return { count: 0, cost: ZERO, affordable: false };
  if (amount !== 'max') {
    const count = Math.min(amount, left);
    const cost = packCost(def, level, count);
    return { count, cost, affordable: gold.gte(cost) };
  }
  const count = affordableCount(def, level, gold, left);
  if (count === 0) return { count: 1, cost: packCost(def, level, 1), affordable: false };
  return { count, cost: packCost(def, level, count), affordable: true };
}
