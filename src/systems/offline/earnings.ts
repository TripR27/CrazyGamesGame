import { SERVING } from '@/data/brewing';
import type { CustomerDef } from '@/data/customers/types';
import { VIP_SPAWN } from '@/data/customers/vip';
import type { RecipeDef } from '@/data/recipes/types';
import { num, ZERO, type Num } from '@/shared/numbers';
import { priciestRecipe } from '@/systems/customers/pick-type';
import { drinkBonus, orderWeight } from '@/systems/effects/bonus';
import { tipSize } from '@/systems/effects/tip';
import { levelFor } from '@/systems/reputation/level';
import { computePayout } from '@/systems/serving/payout';

/** What one served drink brings on average: gold (tips counted by their chance) and reputation. */
export interface Reward {
  gold: Num;
  reputation: number;
}

const NOTHING: Reward = { gold: ZERO, reputation: 0 };

/** One drink for one customer, with the drink effects worked in as an expected value (no randomness). */
function expectedReward(recipe: RecipeDef, type: CustomerDef, sellMultiplier: Num): Reward {
  const bonus = drinkBonus(recipe, type);
  const price = computePayout(recipe, type, sellMultiplier);
  return {
    gold: price.add(tipSize(price, bonus).mul(bonus.tipChance)),
    reputation: SERVING.reputationPerServe + bonus.extraReputation + (type.reputationBonus ?? 0),
  };
}

/** Rewards averaged with weights (equal weights when none are given). */
function average(rewards: readonly Reward[], weights: readonly number[] = rewards.map(() => 1)): Reward {
  const total = weights.reduce((sum, w) => sum + w, 0);
  if (rewards.length === 0 || total <= 0) return NOTHING;
  return {
    gold: rewards.reduce((sum, r, i) => sum.add(r.gold.mul(weights[i] ?? 0)), num(0)).div(total),
    reputation: rewards.reduce((sum, r, i) => sum + r.reputation * (weights[i] ?? 0), 0) / total,
  };
}

/** One kind of customer: what they order (a VIP the priciest drink, others liked drinks more often). */
function customerReward(recipes: readonly RecipeDef[], type: CustomerDef, sellMultiplier: Num): Reward {
  const orders = type.vip === true ? [priciestRecipe(recipes)].filter((r) => r !== undefined) : recipes;
  return average(orders.map((r) => expectedReward(r, type, sellMultiplier)), orders.map((r) => orderWeight(type, r)));
}

/**
 * What one served drink brings on average at this reputation: the regular customers of the level (evenly,
 * like the spawner picks them), and VIPs by their chance (`vipChance`) once one is open. Zero when nobody could order.
 */
export function averageReward(
  recipes: readonly RecipeDef[],
  customerTypes: readonly CustomerDef[],
  reputation: number,
  sellMultiplier: Num,
  vipChance: number = VIP_SPAWN.chance,
): Reward {
  if (recipes.length === 0) return NOTHING;
  const open = customerTypes.filter((c) => c.minLevel <= levelFor(reputation));
  const byType = (vip: boolean): Reward =>
    average(open.filter((c) => (c.vip === true) === vip).map((c) => customerReward(recipes, c, sellMultiplier)));
  const regular = byType(false);
  if (!open.some((c) => c.vip === true)) return regular;
  return average([regular, byType(true)], [1 - vipChance, vipChance]);
}
