import { pickRandom, pickWeighted, type Rng } from '@/core/rng';
import { isLiked, orderWeight } from '@/systems/effects';
import { freeSeats } from './floor';
import type { CustomerCatalog, CustomerChange, CustomerContext, CustomerFloor } from './types';

/**
 * Seat one new customer if there is a free seat, a customer type the reputation allows,
 * and a known recipe to order. Returns the change to announce, or undefined when nothing could spawn.
 */
export function trySpawn(
  floor: CustomerFloor,
  context: CustomerContext,
  catalog: CustomerCatalog,
  rng: Rng,
): CustomerChange | undefined {
  if (floor.customers.length >= context.maxCustomers) return undefined;
  const type = pickRandom(
    rng,
    catalog.customerTypes.filter((c) => c.minReputation <= context.reputation),
  );
  const known = catalog.recipes.filter((r) => context.unlockedRecipeIds.includes(r.id));
  // A customer orders a drink they like more often than another.
  const recipe = type === undefined ? undefined : pickWeighted(rng, known, (r) => orderWeight(type, r));
  const seat = pickRandom(rng, freeSeats(floor));
  if (type === undefined || recipe === undefined || seat === undefined) return undefined;

  const patienceMaxMs = type.patienceSeconds * 1000;
  const id = floor.nextId++;
  const liked = isLiked(type, recipe);
  floor.customers.push({ id, typeId: type.id, recipeId: recipe.id, seat, patienceMs: patienceMaxMs, patienceMaxMs, liked });
  return { kind: 'arrived', id, liked };
}
