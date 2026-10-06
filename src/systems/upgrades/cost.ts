import { num, type Num } from '@/core/numbers';
import type { UpgradeDef } from '@/data/upgrades';

/** Cost of one level: `baseCost * growth^level`, in whole coins (at least 1). */
export function levelCost(def: UpgradeDef, level: number): Num {
  return num(def.baseCost).mul(num(def.growth).pow(level)).round().max(1);
}

/**
 * Cost of `count` levels in a row starting at `level`: the sum of the geometric series in one go.
 * The price shown for a pack is exactly what is paid, with no loop even for huge counts.
 */
export function packCost(def: UpgradeDef, level: number, count: number): Num {
  if (count <= 1) return levelCost(def, level);
  const first = num(def.baseCost).mul(num(def.growth).pow(level));
  return first.mul(num(def.growth).pow(count).sub(1)).div(def.growth - 1).round().max(1);
}

/** How many levels in a row `gold` pays for, at most `limit`. */
export function affordableCount(def: UpgradeDef, level: number, gold: Num, limit: number): number {
  if (gold.lt(levelCost(def, level))) return 0;
  const first = num(def.baseCost).mul(num(def.growth).pow(level));
  const estimate = Math.floor(gold.mul(def.growth - 1).div(first).add(1).log10() / Math.log10(def.growth));
  let count = Math.min(Math.max(estimate, 1), limit);
  // The estimate ignores rounding; nudge it until it is exactly right.
  while (count < limit && packCost(def, level, count + 1).lte(gold)) count++;
  while (count > 0 && packCost(def, level, count).gt(gold)) count--;
  return count;
}
