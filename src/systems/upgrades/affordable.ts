import type { EventBus } from '@/core/events';
import type { GameEvents } from '@/core/game-events';
import type { UpgradeDef } from '@/data/upgrades';
import { quoteFor, type UpgradeState } from './buy';

/** The first upgrade the player can pay for with one more level right now, or undefined. */
export function firstAffordable(state: UpgradeState, defs: readonly UpgradeDef[]): UpgradeDef | undefined {
  return defs.find((def) => quoteFor(state, def, 1).affordable);
}

/** Which event announces the moment: one for the shop upgrades, one for staff. */
export type AffordableEvent = 'upgrade:affordable' | 'staff:affordable' | 'seats:affordable';

export interface AffordableSource {
  getState(): UpgradeState;
  subscribe(listener: () => void): () => void;
}

/**
 * Publishes `upgrade:affordable` each time the player goes from "cannot buy anything" to "can buy something".
 * The tutorial uses this to know when the shop becomes useful. Returns a stop function.
 */
export function watchAffordable(
  source: AffordableSource,
  bus: EventBus<GameEvents>,
  defs: readonly UpgradeDef[],
  event: AffordableEvent = 'upgrade:affordable',
): () => void {
  let could = firstAffordable(source.getState(), defs) !== undefined;
  return source.subscribe(() => {
    const can = firstAffordable(source.getState(), defs) !== undefined;
    if (can && !could) bus.emit(event, {});
    could = can;
  });
}
