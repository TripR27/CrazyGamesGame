import { dismiss } from './floor';
import type { CustomerChange, CustomerFloor, CustomerInstance } from './types';

/** A served customer stays in their seat to drink; the seat frees up once the drink is finished. */
export function startDrinking(customer: CustomerInstance, drinkMs: number): void {
  customer.drinkMsLeft = Math.max(0, drinkMs);
}

/** Drinking customers get closer to finishing; those who are done leave happy. */
export function advanceDrinking(floor: CustomerFloor, deltaMs: number): CustomerChange[] {
  const drinking = floor.customers.filter((c) => c.drinkMsLeft !== undefined);
  for (const customer of drinking) customer.drinkMsLeft = (customer.drinkMsLeft ?? 0) - deltaMs;
  const finished = drinking.filter((c) => (c.drinkMsLeft ?? 0) <= 0);
  return finished.flatMap((c) => dismiss(floor, c.id, 'served') ?? []);
}
