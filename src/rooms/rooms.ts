import type { UpgradeEffect } from '@/economy/upgrade-data';
import type { OneTimePurchase } from '@/shared/content';
import type { EventBus, GameEvents } from '@/shared/events';
import { oneTimeOffer, type BuyerState, type OneTimeOffer, watchBuyable, type WatchSource } from '@/shared/purchases';

/**
 * A room on the upper floor, built once in the shop. `seats` are extra places for customers in that room (the
 * scene has a spot for each); `effects` are bonuses on the same stats upgrades use, counted once the room is built.
 * Texts: `rooms.<id>.name` and `rooms.<id>.description` (`{seats}` and the effect amounts filled in).
 */
export interface RoomDef {
  id: string;
  buy: OneTimePurchase;
  seats: number;
  effects: readonly UpgradeEffect[];
}

/**
 * The rooms on the upper floor, left to right (the scene shows them in this order; customer seats are numbered
 * downstairs first, then room by room). Placeholder prices: tuned with `npm run simulate`. A new room is data here,
 * a spot in scene/layout-rooms.ts and its texts.
 */
export const ROOMS: readonly RoomDef[] = [
  { id: 'extension', buy: { level: 3, cost: 1500 }, seats: 3, effects: [] },
  {
    id: 'alchemy_lab',
    buy: { level: 4, cost: 8000 },
    seats: 0,
    effects: [
      { stat: 'brewSpeed', mode: 'multiply', perLevel: 0.25 },
      { stat: 'storage', mode: 'add', perLevel: 1 },
    ],
  },
  { id: 'vip_lounge', buy: { level: 5, cost: 30_000 }, seats: 2, effects: [{ stat: 'vipChance', mode: 'multiply', perLevel: 1 }] },
];

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

/** The seats of the tavern: `ground` places downstairs, then each room's seats in the order of the rooms. */
export interface SeatPlan {
  ground: number;
  rooms: readonly RoomDef[];
}

/** Every seat number there is (downstairs and in every room, built or not). */
export const totalSeats = (plan: SeatPlan): number => plan.ground + plan.rooms.reduce((sum, r) => sum + r.seats, 0);

/** The seat numbers of one room, or an empty list for an unknown room. */
export function roomSeatNumbers(plan: SeatPlan, roomId: string): number[] {
  const index = plan.rooms.findIndex((r) => r.id === roomId);
  const first = plan.ground + plan.rooms.slice(0, Math.max(0, index)).reduce((sum, r) => sum + r.seats, 0);
  return index === -1 ? [] : Array.from({ length: plan.rooms[index]?.seats ?? 0 }, (_, i) => first + i);
}

/**
 * The seats customers may use: the first `bought` downstairs (the player starts with one and buys more), plus every
 * seat in a built room.
 */
export function openSeats(plan: SeatPlan, bought: number, built: readonly string[]): number[] {
  const downstairs = Array.from({ length: Math.min(plan.ground, Math.max(0, bought)) }, (_, i) => i);
  return [...downstairs, ...plan.rooms.filter((r) => built.includes(r.id)).flatMap((r) => roomSeatNumbers(plan, r.id))];
}

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
