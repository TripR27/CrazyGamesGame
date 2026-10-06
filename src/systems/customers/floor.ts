import type { LeaveReason } from '@/core/game-events';
import { SPAWNING } from '@/data/customers/spawning';
import type { CustomerChange, CustomerFloor, CustomerInstance } from './types';

export function createFloor(capacity: number): CustomerFloor {
  return { capacity, customers: [], nextId: 1, spawnInMs: SPAWNING.firstDelayMs };
}

export function findCustomer(floor: CustomerFloor, id: number): CustomerInstance | undefined {
  return floor.customers.find((c) => c.id === id);
}

export function freeSeats(floor: CustomerFloor): number[] {
  const taken = new Set(floor.customers.map((c) => c.seat));
  return Array.from({ length: floor.capacity }, (_, seat) => seat).filter((s) => !taken.has(s));
}

/** Remove a customer from the floor. Returns the change to announce, or undefined if they were not there. */
export function dismiss(floor: CustomerFloor, id: number, reason: LeaveReason): CustomerChange | undefined {
  const index = floor.customers.findIndex((c) => c.id === id);
  if (index === -1) return undefined;
  floor.customers.splice(index, 1);
  return { kind: 'left', id, reason };
}
