import { ROOMS } from '@/rooms/rooms';

/** Placeholder colours; the art pass (step 21) replaces them. */
export const PALETTE = {
  ground: 0x3f6b3a,
  wall: 0xb98a5a,
  wallShade: 0x9c7147,
  floor: 0x6b4423,
  floorLine: 0x573718,
  door: 0x4a2c14,
  doorKnob: 0xf5c542,
  wood: 0x8b5a2b,
  woodDark: 0x5e3a18,
  barTop: 0xc58b4a,
  cauldron: 0x2b2b33,
  cauldronRim: 0x45454f,
  brew: 0x7be05a,
  fireOuter: 0xe8641a,
  fireInner: 0xf5c542,
  slot: 0xfff2cc,
} as const;

/** Placeholder tavern layout in design pixels (1280x720). Pure data: no Phaser. */
export interface Point {
  x: number;
  y: number;
}

/** x and y are the top-left corner. */
export interface Rect extends Point {
  w: number;
  h: number;
}

export type SlotKind = 'table' | 'stool';

/** A spot where a customer can sit or stand; x and y are where their feet land. */
export interface CustomerSlot extends Point {
  id: string;
  kind: SlotKind;
}

export const HUD_HEIGHT = 64;
export const FLOOR_Y = 560;
export const GROUND_Y = 640;

export const BUILDING: Rect = { x: 40, y: 80, w: 1200, h: GROUND_Y - 80 };
export const DOOR: Rect = { x: 70, y: 400, w: 90, h: FLOOR_Y - 400 };
export const DOOR_ENTRY: Point = { x: 115, y: FLOOR_Y + 20 };

export const BAR: Rect = { x: 860, y: 470, w: 380, h: FLOOR_Y - 470 };
export const CAULDRON: Rect = { x: 700, y: 440, w: 120, h: FLOOR_Y - 440 };

/** Wall shelf with the ingredients; each slot is where an ingredient sits (centre). */
export const SHELF: Rect = { x: 300, y: 300, w: 440, h: 10 };
const SHELF_FIRST_X = 340;
export const SHELF_GAP = 72;
const SHELF_SLOTS = 6;
export const INGREDIENT_SLOTS: readonly Point[] = Array.from({ length: SHELF_SLOTS }, (_, i) => ({
  x: SHELF_FIRST_X + i * SHELF_GAP,
  y: SHELF.y - 22,
}));

/** Where finished drinks stand on the bar (centre x, y of the bar top). Room for the bar upgrades. */
export const READY_SLOTS: readonly Point[] = [890, 955, 1020, 1085, 1150, 1215].map((x) => ({ x, y: 470 }));

export const TABLES: readonly Rect[] = [
  { x: 260, y: 505, w: 120, h: 14 },
  { x: 500, y: 505, w: 120, h: 14 },
];

const TABLE_SEAT_OFFSET = 90;
const TABLE_SLOT_Y = FLOOR_Y + 22;
const STOOL_SLOT_Y = FLOOR_Y + 48;
const STOOL_XS = [900, 1010, 1120] as const;

const tableSlots = (): CustomerSlot[] =>
  TABLES.flatMap((table, i) => {
    const cx = table.x + table.w / 2;
    return [
      { id: `table${i + 1}-left`, kind: 'table' as const, x: cx - TABLE_SEAT_OFFSET, y: TABLE_SLOT_Y },
      { id: `table${i + 1}-right`, kind: 'table' as const, x: cx + TABLE_SEAT_OFFSET, y: TABLE_SLOT_Y },
    ];
  });

const stoolSlots = (): CustomerSlot[] =>
  STOOL_XS.map((x, i) => ({ id: `stool${i + 1}`, kind: 'stool' as const, x, y: STOOL_SLOT_Y }));

export const CUSTOMER_SLOTS: readonly CustomerSlot[] = [...tableSlots(), ...stoolSlots()];

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

/**
 * Where each decoration sits downstairs (its whole drawing fits in the rect): torches and trophies on the back wall,
 * rugs on the floor. One entry per decoration in decor/decor.ts.
 */
export const DECOR_SPOTS: Readonly<Record<string, Rect>> = {
  wall_torch: { x: 196, y: 320, w: 28, h: 80 },
  woven_rug: { x: 230, y: 572, w: 420, h: 24 },
  boar_trophy: { x: 925, y: 320, w: 90, h: 84 },
  everburning_torch: { x: 828, y: 320, w: 28, h: 80 },
  royal_carpet: { x: 870, y: 590, w: 360, h: 36 },
  golden_tankard: { x: 1100, y: 320, w: 90, h: 84 },
};
