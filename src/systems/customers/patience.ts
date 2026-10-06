import { dismiss, waitingCustomers } from './floor';
import type { CustomerChange, CustomerFloor } from './types';

/** Lower the patience of everyone still waiting; customers who run out leave. Drinking customers are happy. */
export function advancePatience(floor: CustomerFloor, deltaMs: number): CustomerChange[] {
  const waiting = waitingCustomers(floor);
  for (const customer of waiting) customer.patienceMs -= deltaMs;
  const expired = waiting.filter((c) => c.patienceMs <= 0);
  return expired.flatMap((c) => dismiss(floor, c.id, 'impatient') ?? []);
}
