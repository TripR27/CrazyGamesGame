import type { EventBus } from '@/core/events';
import type { GameEvents } from '@/core/game-events';
import type { Rng } from '@/core/rng';
import type { CustomerCatalog, CustomerChange, CustomerContext, CustomerFloor } from './types';
import { updateCustomers } from './update';

export interface CustomerSystemDeps {
  floor: CustomerFloor;
  bus: EventBus<GameEvents>;
  rng: Rng;
  catalog: CustomerCatalog;
  /** Read fresh on every step, so reputation and new recipes take effect immediately. */
  getContext(): CustomerContext;
}

export function publishChange(bus: EventBus<GameEvents>, change: CustomerChange): void {
  if (change.kind === 'arrived') bus.emit('customer:arrived', { id: change.id });
  else bus.emit('customer:left', { id: change.id, reason: change.reason });
}

/** Runs the customer simulation on every game tick. Returns a stop function. */
export function startCustomerSystem(deps: CustomerSystemDeps): () => void {
  return deps.bus.on('tick', ({ deltaMs }) => {
    const context = deps.getContext();
    for (const change of updateCustomers(deps.floor, context, deps.catalog, deps.rng, deltaMs)) {
      publishChange(deps.bus, change);
    }
  });
}
