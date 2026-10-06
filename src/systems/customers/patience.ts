import { dismiss } from './floor';
import type { CustomerChange, CustomerFloor } from './types';

/** Lower everyone's patience; customers who run out leave. */
export function advancePatience(floor: CustomerFloor, deltaMs: number): CustomerChange[] {
  for (const customer of floor.customers) customer.patienceMs -= deltaMs;
  const expired = floor.customers.filter((c) => c.patienceMs <= 0);
  return expired.flatMap((c) => dismiss(floor, c.id, 'impatient') ?? []);
}
