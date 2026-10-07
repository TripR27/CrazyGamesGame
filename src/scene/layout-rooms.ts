import { ROOMS } from '@/rooms/rooms';
import { CUSTOMER_SLOTS, type Point, type Rect } from '@/scene/layout';

/** The floor of the upper storey (where customers in a room stand) and its beam. */
export const UPPER_FLOOR_Y = 240;
export const UPPER_BEAM: Rect = { x: 40, y: UPPER_FLOOR_Y, w: 1200, h: 10 };

/** Where a room sits on the upper floor, and the spots of its customer seats (feet). Pure data: no Phaser. */
export interface RoomSpot {
  rect: Rect;
  seats: readonly Point[];
}

const ROOM_TOP = 96;
const roomRect = (index: number): Rect => ({ x: 56 + index * 392, y: ROOM_TOP, w: 380, h: UPPER_FLOOR_Y - ROOM_TOP });
const seat = (x: number): Point => ({ x, y: UPPER_FLOOR_Y - 2 });

/** One entry per room in data/rooms, left to right. */
export const ROOM_SPOTS: Readonly<Record<string, RoomSpot>> = {
  extension: { rect: roomRect(0), seats: [seat(130), seat(246), seat(362)] },
  alchemy_lab: { rect: roomRect(1), seats: [] },
  vip_lounge: { rect: roomRect(2), seats: [seat(950), seat(1110)] },
};

/** Every customer seat: downstairs first, then each room's seats in room order (the seat numbers of the game). */
export const SEAT_SLOTS: readonly Point[] = [...CUSTOMER_SLOTS, ...ROOMS.flatMap((r) => ROOM_SPOTS[r.id]?.seats ?? [])];
