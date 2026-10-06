import type { Rng } from '@/core/rng';
import { SPAWNING } from '@/data/customers/spawning';
import { freeSeats } from './floor';
import { advanceDrinking } from './drinking';
import { advancePatience } from './patience';
import { trySpawn } from './spawn';
import { nextSpawnDelayMs } from './spawn-timing';
import type { CustomerCatalog, CustomerChange, CustomerContext, CustomerFloor } from './types';

/**
 * One simulation step: drinks are finished, patience runs down, then a new customer may arrive.
 * While the tavern is full the timer does not drop below the refill delay, so when a seat frees up the
 * next customer still needs a moment to walk in: customers come gradually, not in a stream.
 */
export function updateCustomers(
  floor: CustomerFloor,
  context: CustomerContext,
  catalog: CustomerCatalog,
  rng: Rng,
  deltaMs: number,
): CustomerChange[] {
  // Drinking goes on during a lesson too, otherwise a served customer would hold the only seat.
  const changes = [...advanceDrinking(floor, deltaMs), ...(context.freezePatience ? [] : advancePatience(floor, deltaMs))];
  const full = floor.customers.length >= context.maxCustomers || freeSeats(floor).length === 0;
  floor.spawnInMs = Math.max(full ? SPAWNING.refillDelayMs : 0, floor.spawnInMs - deltaMs);
  if (floor.spawnInMs > 0) return changes;

  const arrived = trySpawn(floor, context, catalog, rng);
  if (arrived === undefined) return changes;
  floor.spawnInMs = nextSpawnDelayMs(context.reputation, rng);
  return [...changes, arrived];
}
