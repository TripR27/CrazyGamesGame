import { pickRandom, pickWeighted, type Rng } from '@/core/rng';
import type { CustomerDef } from '@/data/customers';
import { VIP_SPAWN } from '@/data/customers/vip';
import type { RecipeDef } from '@/data/recipes';
import { orderWeight } from '@/systems/effects';

const isVip = (type: CustomerDef): boolean => type.vip === true;

/**
 * Who walks in at this level: now and then a VIP (once one is open), otherwise a regular customer.
 * Without an open VIP no chance is rolled, so the random sequence stays as it was before VIPs.
 */
export function pickCustomerType(
  rng: Rng,
  types: readonly CustomerDef[],
  level: number,
  vipChance: number = VIP_SPAWN.chance,
): CustomerDef | undefined {
  const open = types.filter((c) => c.minLevel <= level);
  const vips = open.filter(isVip);
  if (vips.length > 0 && rng() < vipChance) return pickRandom(rng, vips);
  return pickRandom(rng, open.filter((c) => !isVip(c)));
}

/** A VIP orders the most expensive drink the player knows. */
export function priciestRecipe(recipes: readonly RecipeDef[]): RecipeDef | undefined {
  return recipes.reduce<RecipeDef | undefined>((best, r) => (best === undefined || r.basePrice > best.basePrice ? r : best), undefined);
}

/** What this customer orders: a VIP the most expensive drink, anyone else a drink they like more often than another. */
export function pickOrder(rng: Rng, type: CustomerDef, known: readonly RecipeDef[]): RecipeDef | undefined {
  return isVip(type) ? priciestRecipe(known) : pickWeighted(rng, known, (r) => orderWeight(type, r));
}
