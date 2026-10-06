import type { TargetRegistry } from '@/core/target-registry';
import { ingredients } from '@/data/ingredients';
import { recipes } from '@/data/recipes';
import { ROOMS } from '@/data/rooms';
import type { PlayerActions } from '@/systems/actions';
import { shopIngredients, type IngredientShopState } from '@/systems/ingredients';
import { roomOffer, type RoomState } from '@/systems/rooms';
import { isListed as ingredientListed, toIngredientRowView } from './ingredient-view-model';
import { isListed } from './one-time-view-model';
import { mountOneTimeSection } from './one-time-section';
import { toRoomRowView } from './room-view-model';

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
