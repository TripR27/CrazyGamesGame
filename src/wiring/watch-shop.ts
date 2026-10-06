import type { EventBus } from '@/core/events';
import type { GameEvents } from '@/core/game-events';
import type { GameState } from '@/core/state';
import type { Store } from '@/core/store';
import { upgrades } from '@/data/upgrades';
import { staffOnly, watchAffordable, withoutStaff } from '@/systems/upgrades';

/** Two tutorial moments: the first shop upgrade becomes affordable, and the first staff member does. */
export function watchShop(store: Store<GameState>, bus: EventBus<GameEvents>): void {
  watchAffordable(store, bus, withoutStaff(upgrades));
  watchAffordable(store, bus, staffOnly(upgrades), 'staff:affordable');
}
