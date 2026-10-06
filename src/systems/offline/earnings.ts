import { num, ZERO, type Num } from '@/core/numbers';
import { SERVING } from '@/data/brewing';
import type { CustomerDef } from '@/data/customers';
import type { RecipeDef } from '@/data/recipes';
import { drinkBonus, orderWeight, tipSize } from '@/systems/effects';
import { computePayout } from '@/systems/serving';

/** What one served drink brings on average: gold (tips counted by their chance) and reputation. */
export interface Reward {
  gold: Num;
  reputation: number;
}

/** One drink for one customer, with the drink effects worked in as an expected value (no randomness). */
function expectedReward(recipe: RecipeDef, type: CustomerDef, sellMultiplier: Num): Reward {
  const bonus = drinkBonus(recipe, type);
  const price = computePayout(recipe, type, sellMultiplier);
  return {
    gold: price.add(tipSize(price, bonus).mul(bonus.tipChance)),
    reputation: SERVING.reputationPerServe + bonus.extraReputation,
  };
}

/** One kind of customer: their known drinks, weighted the way they order them (liked drinks more often). */
function customerReward(recipes: readonly RecipeDef[], type: CustomerDef, sellMultiplier: Num): Reward {
  const weights = recipes.map((r) => orderWeight(type, r));
  const total = weights.reduce((sum, w) => sum + w, 0);
  const rewards = recipes.map((r) => expectedReward(r, type, sellMultiplier));
  return {
    gold: rewards.reduce((sum, r, i) => sum.add(r.gold.mul(weights[i] ?? 0)), num(0)).div(total),
    reputation: rewards.reduce((sum, r, i) => sum + r.reputation * (weights[i] ?? 0), 0) / total,
  };
}

/**
 * What one served drink brings on average: every kind of customer that comes at this reputation (evenly,
 * like the spawner picks them) against the known recipes they order. Zero when nobody could order anything.
 */
export function averageReward(
  recipes: readonly RecipeDef[],
  customerTypes: readonly CustomerDef[],
  reputation: number,
  sellMultiplier: Num,
): Reward {
  const types = customerTypes.filter((c) => c.minReputation <= reputation);
  if (types.length === 0 || recipes.length === 0) return { gold: ZERO, reputation: 0 };
  const rewards = types.map((type) => customerReward(recipes, type, sellMultiplier));
  return {
    gold: rewards.reduce((sum, r) => sum.add(r.gold), num(0)).div(types.length),
    reputation: rewards.reduce((sum, r) => sum + r.reputation, 0) / types.length,
  };
}
