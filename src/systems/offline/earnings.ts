import { num, ZERO, type Num } from '@/core/numbers';
import type { CustomerDef } from '@/data/customers';
import type { RecipeDef } from '@/data/recipes';
import { computePayout } from '@/systems/serving';

/**
 * What one served drink pays on average: every known recipe against every kind of customer that
 * comes at this reputation (customers pick both at random, evenly), with the sell-price multiplier.
 * Zero when nobody could order anything.
 */
export function averagePayout(
  recipes: readonly RecipeDef[],
  customerTypes: readonly CustomerDef[],
  reputation: number,
  sellMultiplier: Num,
): Num {
  const types = customerTypes.filter((c) => c.minReputation <= reputation);
  const payouts = recipes.flatMap((r) => types.map((c) => computePayout(r, c, sellMultiplier)));
  if (payouts.length === 0) return ZERO;
  return payouts.reduce((sum, p) => sum.add(p), num(0)).div(payouts.length);
}
