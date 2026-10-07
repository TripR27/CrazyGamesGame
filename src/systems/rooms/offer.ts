import type { RoomDef } from '@/data/rooms/types';
import type { EventBus, GameEvents } from '@/shared/events';
import { oneTimeOffer, type BuyerState, type OneTimeOffer } from '@/systems/purchases/one-time';
import { watchBuyable, type WatchSource } from '@/systems/purchases/watch';

/** The part of the state rooms read and change. */
export interface RoomState extends BuyerState {
  roomsBuilt: string[];
}

export interface RoomStore {
  getState(): RoomState;
  update(mutator: (state: RoomState) => void): void;
}

export const roomOffer = (state: RoomState, room: RoomDef): OneTimeOffer => oneTimeOffer(room.buy, state.roomsBuilt.includes(room.id), state);

/** The first room the player can build right now, or undefined. */
export const firstBuildableRoom = (state: RoomState, rooms: readonly RoomDef[]): RoomDef | undefined =>
  rooms.find((room) => roomOffer(state, room).affordable);

/** Builds a room once: pays and adds it. Returns false when it cannot be built (locked, built or too expensive). */
export function buildRoom(store: RoomStore, room: RoomDef): boolean {
  const offer = roomOffer(store.getState(), room);
  if (!offer.affordable) return false;
  store.update((state) => {
    state.currencies.gold = state.currencies.gold.sub(offer.cost);
    state.roomsBuilt.push(room.id);
  });
  return true;
}

/** Publishes `rooms:affordable` each time a room becomes buildable. Returns a stop function. */
export function watchRoomShop(source: WatchSource<RoomState>, bus: EventBus<GameEvents>, rooms: readonly RoomDef[]): () => void {
  return watchBuyable(source, bus, (state) => firstBuildableRoom(state, rooms) !== undefined, 'rooms:affordable');
}
