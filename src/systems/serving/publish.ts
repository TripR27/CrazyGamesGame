import type { EventBus } from '@/core/events';
import type { GameEvents } from '@/core/game-events';
import { serveCustomer, type ServeDeps } from './serve';
import type { ServeOutcome } from './types';

/** Serves a customer and announces what happened. The player (a click) and the waitress both use this. */
export function serveAndPublish(deps: ServeDeps & { bus: EventBus<GameEvents> }, customerId: number): ServeOutcome {
  const outcome = serveCustomer(deps, customerId);
  if (outcome.kind === 'served') {
    deps.bus.emit('customer:served', outcome.event);
    if (outcome.event.liked) deps.bus.emit('likes:served', { id: customerId });
    if (outcome.event.vip) deps.bus.emit('vip:served', { id: customerId });
  } else if (outcome.kind === 'refused') {
    deps.bus.emit('customer:refused', outcome.event);
  }
  return outcome;
}
