import { pickRandom, type Rng } from '@/core/rng';
import { isLiked } from '@/systems/effects';
import { levelFor } from '@/systems/reputation';
import { pickCustomerType, pickOrder } from './pick-type';
import { freeSeats } from './floor';
import type { CustomerCatalog, CustomerChange, CustomerContext, CustomerFloor } from './types';

/**
 * Seat one new customer if there is a free seat, a customer type the reputation level allows,
 * and a known recipe to order. Returns the change to announce, or undefined when nothing could spawn.
 */
export function trySpawn(
  floor: CustomerFloor,
  context: CustomerContext,
  catalog: CustomerCatalog,
  rng: Rng,
): CustomerChange | undefined {
  if (floor.customers.length >= context.maxCustomers) return undefined;
  const type = pickCustomerType(rng, catalog.customerTypes, levelFor(context.reputation));
  const known = catalog.recipes.filter((r) => context.unlockedRecipeIds.includes(r.id));
  const recipe = type === undefined ? undefined : pickOrder(rng, type, known);
  const seat = pickRandom(rng, freeSeats(floor));
  if (type === undefined || recipe === undefined || seat === undefined) return undefined;

  const patienceMaxMs = type.patienceSeconds * 1000;
  const id = floor.nextId++;
  const liked = isLiked(type, recipe);
  const vip = type.vip === true;
  floor.customers.push({ id, typeId: type.id, recipeId: recipe.id, seat, patienceMs: patienceMaxMs, patienceMaxMs, liked, vip });
  return { kind: 'arrived', id, liked, vip };
}
