import type { EventBus, GameEvents } from '@/shared/events';
import { advanceBrewing } from '@/systems/brewing/advance';
import type { BrewEvent, BrewStation } from '@/systems/brewing/types';

export function publishBrewEvent(bus: EventBus<GameEvents>, event: BrewEvent): void {
  if (event.kind === 'discovered') bus.emit('recipe:discovered', { recipeId: event.recipeId });
  else if (event.kind === 'started') bus.emit('brew:started', { recipeId: event.recipeId });
  else if (event.kind === 'done') bus.emit('brew:done', { recipeId: event.recipeId });
  else bus.emit('brew:notice', { notice: event.notice, messageKey: event.messageKey });
}

/** Runs the brew timer on every game tick. Returns a stop function. */
export function startBrewSystem(station: BrewStation, bus: EventBus<GameEvents>): () => void {
  return bus.on('tick', ({ deltaMs }) => {
    for (const event of advanceBrewing(station, deltaMs)) publishBrewEvent(bus, event);
  });
}
