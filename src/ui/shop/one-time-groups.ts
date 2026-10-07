import { ingredients } from '@/data/ingredients/index';
import { recipes } from '@/recipes/recipe-data';
import { ROOMS, roomOffer, type RoomState } from '@/rooms/rooms';
import type { TargetRegistry } from '@/shared/targets';
import type { PlayerActions } from '@/systems/actions/player-actions';
import { shopIngredients, type IngredientShopState } from '@/systems/ingredients/offer';
import { isListed as ingredientListed, toIngredientRowView } from '@/ui/shop/ingredient-view-model';
import { mountOneTimeSection } from '@/ui/shop/one-time-section';
import { isListed } from '@/ui/shop/one-time-view-model';
import { toRoomRowView } from '@/ui/shop/room-view-model';

export type OneTimeState = IngredientShopState & RoomState;

export interface OneTimeGroupHosts {
  list: HTMLElement;
  root: HTMLElement;
  panel: HTMLElement;
  actions: Pick<PlayerActions, 'buyIngredient' | 'buildRoom'>;
  targets: TargetRegistry;
}

/** The groups at the top of the shop: ingredients, then rooms. Returns the render function for both. */
export function mountOneTimeGroups({ list, root, panel, actions, targets }: OneTimeGroupHosts): (state: OneTimeState) => void {
  const catalog = { ingredients, recipes };
  const renderIngredients = mountOneTimeSection<OneTimeState>({
    list, root, panel, targets,
    headingKey: 'shop.kind_ingredients',
    targetPrefix: 'ingredient-buy',
    entries: shopIngredients(catalog).map((def) => ({
      id: def.id,
      listed: (state) => ingredientListed(def, state, catalog),
      view: (state) => toIngredientRowView(def, state, catalog),
    })),
    onBuy: actions.buyIngredient,
  });
  const renderRooms = mountOneTimeSection<OneTimeState>({
    list, root, panel, targets,
    headingKey: 'shop.kind_rooms',
    targetPrefix: 'room-buy',
    entries: ROOMS.map((room) => ({
      id: room.id,
      listed: (state) => isListed(roomOffer(state, room)),
      view: (state) => toRoomRowView(room, state),
    })),
    onBuy: actions.buildRoom,
  });
  return (state) => {
    renderIngredients(state);
    renderRooms(state);
  };
}
