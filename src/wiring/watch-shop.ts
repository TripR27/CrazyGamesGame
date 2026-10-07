import { type IngredientCatalog, watchIngredientShop } from '@/brewing/ingredients';
import { upgrades } from '@/economy/upgrade-data';
import { watchAffordable, generalOnly, seatsOnly, staffOnly } from '@/economy/upgrades';
import { ROOMS, watchRoomShop } from '@/rooms/rooms';
import type { EventBus, GameEvents } from '@/shared/events';
import type { GameState, Store } from '@/shared/state';

/** Tutorial moments: the first shop upgrade, extra seat, staff member, ingredient and room become affordable. */
export function watchShop(store: Store<GameState>, bus: EventBus<GameEvents>, ingredients: IngredientCatalog): void {
  watchAffordable(store, bus, generalOnly(upgrades));
  watchAffordable(store, bus, seatsOnly(upgrades), 'seats:affordable');
  watchAffordable(store, bus, staffOnly(upgrades), 'staff:affordable');
  watchIngredientShop(store, bus, ingredients);
  watchRoomShop(store, bus, ROOMS);
}
