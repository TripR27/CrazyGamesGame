import { num, ONE, type Num } from '@/core/numbers';
import type { CustomerDef } from '@/data/customers';
import type { RecipeDef } from '@/data/recipes';
import { drinkBonus } from '@/systems/effects';

/**
 * Gold for serving a drink: its base price times what this kind of customer spends, the strength of the
 * drink and the sell-price multiplier, in whole coins (at least 1). Tips come on top (see `rollTip`).
 */
export function computePayout(recipe: RecipeDef, customerType: CustomerDef, sellMultiplier: Num = ONE): Num {
  const strength = drinkBonus(recipe, customerType).priceFactor;
  return num(recipe.basePrice).mul(customerType.spendMultiplier).mul(strength).mul(sellMultiplier).round().max(1);
}
