import type { Rng } from '@/core/rng';
import { advancePatience } from './patience';
import { trySpawn } from './spawn';
import { nextSpawnDelayMs } from './spawn-timing';
import type { CustomerCatalog, CustomerChange, CustomerContext, CustomerFloor } from './types';

/**
 * One simulation step: patience runs down, then a new customer may arrive.
 * When the tavern is full the timer stays at zero, so a seat that frees up is refilled on the next step.
 */
export function updateCustomers(
  floor: CustomerFloor,
  context: CustomerContext,
  catalog: CustomerCatalog,
  rng: Rng,
  deltaMs: number,
): CustomerChange[] {
  const changes = context.freezePatience ? [] : advancePatience(floor, deltaMs);
  floor.spawnInMs = Math.max(0, floor.spawnInMs - deltaMs);
  if (floor.spawnInMs > 0) return changes;

  const arrived = trySpawn(floor, context, catalog, rng);
  if (arrived === undefined) return changes;
  floor.spawnInMs = nextSpawnDelayMs(context.reputation, rng);
  return [...changes, arrived];
}
