import { num, ONE, type Num } from '@/core/numbers';
import type { CustomerDef } from '@/data/customers';
import type { RecipeDef } from '@/data/recipes';

/**
 * Gold for serving a drink: its base price times what this kind of customer spends and the
 * sell-price multiplier, in whole coins (at least 1).
 */
export function computePayout(recipe: RecipeDef, customerType: CustomerDef, sellMultiplier: Num = ONE): Num {
  return num(recipe.basePrice).mul(customerType.spendMultiplier).mul(sellMultiplier).round().max(1);
}
