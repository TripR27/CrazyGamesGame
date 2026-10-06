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
