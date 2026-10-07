import { ROOMS } from '@/data/rooms/index';
import { upgrades } from '@/data/upgrades/index';
import type { EventBus, GameEvents } from '@/shared/events';
import type { GameState, Store } from '@/shared/state';
import type { IngredientCatalog } from '@/systems/ingredients/offer';
import { watchIngredientShop } from '@/systems/ingredients/watch';
import { watchRoomShop } from '@/systems/rooms/offer';
import { watchAffordable } from '@/systems/upgrades/affordable';
import { generalOnly, seatsOnly, staffOnly } from '@/systems/upgrades/groups';

/** Tutorial moments: the first shop upgrade, extra seat, staff member, ingredient and room become affordable. */
export function watchShop(store: Store<GameState>, bus: EventBus<GameEvents>, ingredients: IngredientCatalog): void {
  watchAffordable(store, bus, generalOnly(upgrades));
  watchAffordable(store, bus, seatsOnly(upgrades), 'seats:affordable');
  watchAffordable(store, bus, staffOnly(upgrades), 'staff:affordable');
  watchIngredientShop(store, bus, ingredients);
  watchRoomShop(store, bus, ROOMS);
}
