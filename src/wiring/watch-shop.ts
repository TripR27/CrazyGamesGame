import type { EventBus } from '@/core/events';
import type { GameEvents } from '@/core/game-events';
import type { GameState } from '@/core/state';
import type { Store } from '@/core/store';
import { upgrades } from '@/data/upgrades';
import { ROOMS } from '@/data/rooms';
import { watchIngredientShop, type IngredientCatalog } from '@/systems/ingredients';
import { watchRoomShop } from '@/systems/rooms';
import { generalOnly, seatsOnly, staffOnly, watchAffordable } from '@/systems/upgrades';

/** Tutorial moments: the first shop upgrade, extra seat, staff member, ingredient and room become affordable. */
export function watchShop(store: Store<GameState>, bus: EventBus<GameEvents>, ingredients: IngredientCatalog): void {
  watchAffordable(store, bus, generalOnly(upgrades));
  watchAffordable(store, bus, seatsOnly(upgrades), 'seats:affordable');
  watchAffordable(store, bus, staffOnly(upgrades), 'staff:affordable');
  watchIngredientShop(store, bus, ingredients);
  watchRoomShop(store, bus, ROOMS);
}
