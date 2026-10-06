import type { EventBus } from '@/core/events';
import type { GameEvents } from '@/core/game-events';
import type { GameState } from '@/core/state';
import type { Store } from '@/core/store';
import { upgrades } from '@/data/upgrades';
import { generalOnly, seatsOnly, staffOnly, watchAffordable } from '@/systems/upgrades';

/** Tutorial moments: the first shop upgrade, the first extra seat and the first staff member become affordable. */
export function watchShop(store: Store<GameState>, bus: EventBus<GameEvents>): void {
  watchAffordable(store, bus, generalOnly(upgrades));
  watchAffordable(store, bus, seatsOnly(upgrades), 'seats:affordable');
  watchAffordable(store, bus, staffOnly(upgrades), 'staff:affordable');
}
