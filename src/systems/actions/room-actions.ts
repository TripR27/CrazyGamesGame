import type { RoomDef } from '@/data/rooms/types';
import type { EventBus, GameEvents } from '@/shared/events';
import { buildRoom, type RoomStore } from '@/systems/rooms/offer';

export interface RoomActions {
  /** Build a room on the upper floor (one time); does nothing when it is locked, built or too expensive. */
  buildRoom(roomId: string): void;
  /** A boarded-up room was clicked: ask for the side panel on the Shop tab, where rooms are built. */
  requestShop(): void;
}

export interface RoomActionDeps {
  bus: EventBus<GameEvents>;
  /** Left out: rooms cannot be built (tests that are not about rooms). */
  rooms?: { store: RoomStore; defs: readonly RoomDef[] };
}

export function createRoomActions({ bus, rooms }: RoomActionDeps): RoomActions {
  return {
    buildRoom(roomId) {
      const def = rooms?.defs.find((r) => r.id === roomId);
      if (rooms === undefined || def === undefined || !buildRoom(rooms.store, def)) return;
      bus.emit('room:built', { id: def.id });
      bus.emit('saveRequested', {});
    },
    requestShop() {
      bus.emit('shop:requested', {});
    },
  };
}
