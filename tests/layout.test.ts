import { describe, expect, it } from 'vitest';
import { BAR, BUILDING, CAULDRON, CUSTOMER_SLOTS, DECOR_SPOTS, DOOR, FLOOR_Y, GROUND_Y, HUD_HEIGHT, INGREDIENT_SLOTS, READY_SLOTS, SHELF, TABLES, type Rect, ROOM_SPOTS, SEAT_SLOTS, UPPER_FLOOR_Y } from '@/app/layout';
import { GAME_HEIGHT, GAME_WIDTH } from '@/config';
import { upgrades } from '@/economy/upgrade-data';
import { getMultipliers } from '@/economy/upgrades';
import { DECORATIONS } from '@/decor/decor';
import { ROOMS, totalSeats } from '@/rooms/rooms';

const overlaps = (a: Rect, b: Rect): boolean =>
  a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
const inside = (inner: Rect, outer: Rect): boolean =>
  inner.x >= outer.x &&
  inner.y >= outer.y &&
  inner.x + inner.w <= outer.x + outer.w &&
  inner.y + inner.h <= outer.y + outer.h;

describe('tavern layout', () => {
  const props: Record<string, Rect> = { door: DOOR, bar: BAR, cauldron: CAULDRON };

  it('fits the building in the design resolution, below the HUD', () => {
    expect(inside(BUILDING, { x: 0, y: HUD_HEIGHT, w: GAME_WIDTH, h: GAME_HEIGHT - HUD_HEIGHT })).toBe(true);
  });

  it('places every prop inside the building and standing on the floor', () => {
    for (const rect of [...Object.values(props), ...TABLES]) {
      expect(inside(rect, BUILDING)).toBe(true);
    }
    for (const rect of [DOOR, BAR, CAULDRON]) expect(rect.y + rect.h).toBe(FLOOR_Y);
  });

  it('keeps the cauldron, bar, door and tables from overlapping each other', () => {
    const all = [DOOR, BAR, CAULDRON, ...TABLES];
    all.forEach((a, i) => all.slice(i + 1).forEach((b) => expect(overlaps(a, b)).toBe(false)));
  });

  it('has seven customer slots with unique ids, all inside the building', () => {
    expect(CUSTOMER_SLOTS).toHaveLength(7);
    expect(new Set(CUSTOMER_SLOTS.map((s) => s.id)).size).toBe(7);
    for (const slot of CUSTOMER_SLOTS) {
      expect(inside({ x: slot.x, y: slot.y, w: 0, h: 0 }, BUILDING)).toBe(true);
    }
  });

  it('keeps customer slots at least 60 px apart so sprites do not stack', () => {
    CUSTOMER_SLOTS.forEach((a, i) =>
      CUSTOMER_SLOTS.slice(i + 1).forEach((b) => {
        expect(Math.hypot(a.x - b.x, a.y - b.y)).toBeGreaterThanOrEqual(60);
      }),
    );
  });

  it('has room on the shelf for six ingredients, all resting on the shelf plank', () => {
    expect(INGREDIENT_SLOTS).toHaveLength(6);
    for (const slot of INGREDIENT_SLOTS) {
      expect(slot.x - 22).toBeGreaterThanOrEqual(SHELF.x);
      expect(slot.x + 22).toBeLessThanOrEqual(SHELF.x + SHELF.w);
      expect(slot.y + 22).toBe(SHELF.y);
    }
  });

  it('keeps the shelf clear of the cauldron and the bar', () => {
    expect(overlaps(SHELF, CAULDRON)).toBe(false);
    expect(overlaps(SHELF, BAR)).toBe(false);
  });

  it('has a spot on the bar for every drink the bar can hold, even with every storage upgrade bought', () => {
    const maxed = Object.fromEntries(upgrades.map((u) => [u.id, u.maxLevel ?? Infinity]));
    expect(READY_SLOTS.length).toBeGreaterThanOrEqual(getMultipliers({ upgrades: maxed }).storage.toNumber());
    for (const slot of READY_SLOTS) {
      expect(slot.x - 15).toBeGreaterThanOrEqual(BAR.x);
      expect(slot.x + 15).toBeLessThanOrEqual(BAR.x + BAR.w);
      expect(slot.y).toBe(BAR.y);
    }
  });

  it('has a place for every customer the seat upgrades can allow', () => {
    const maxed = Object.fromEntries(upgrades.map((u) => [u.id, u.maxLevel ?? Infinity]));
    expect(getMultipliers({ upgrades: maxed }).seats.toNumber()).toBeLessThanOrEqual(CUSTOMER_SLOTS.length);
  });
});


describe('the upper floor', () => {
  it('has a spot for every room, with a place for each of its seats', () => {
    for (const room of ROOMS) expect(ROOM_SPOTS[room.id]?.seats).toHaveLength(room.seats);
    expect(SEAT_SLOTS).toHaveLength(totalSeats({ ground: CUSTOMER_SLOTS.length, rooms: ROOMS }));
  });

  it('keeps the rooms inside the building, below the HUD and above the shelf, without overlapping', () => {
    const rects = ROOMS.map((r) => ROOM_SPOTS[r.id]?.rect).filter((r): r is Rect => r !== undefined);
    for (const rect of rects) {
      expect(inside(rect, BUILDING)).toBe(true);
      expect(rect.y).toBeGreaterThan(HUD_HEIGHT);
      expect(rect.y + rect.h).toBeLessThan(SHELF.y - 44);
    }
    rects.forEach((a, i) => rects.slice(i + 1).forEach((b) => expect(a.x + a.w <= b.x || b.x + b.w <= a.x).toBe(true)));
  });

  it('puts every room seat on the upper floor, inside its room', () => {
    for (const room of ROOMS) {
      const spot = ROOM_SPOTS[room.id];
      for (const seat of spot?.seats ?? []) {
        expect(seat.y).toBeLessThanOrEqual(UPPER_FLOOR_Y);
        expect(seat.x).toBeGreaterThan(spot?.rect.x ?? 0);
        expect(seat.x).toBeLessThan((spot?.rect.x ?? 0) + (spot?.rect.w ?? 0));
      }
    }
  });

  it('has a spot on the bar for every drink, with every storage upgrade and every room', () => {
    const maxed = Object.fromEntries(upgrades.map((u) => [u.id, u.maxLevel ?? Infinity]));
    const storage = getMultipliers({ upgrades: maxed, roomsBuilt: ROOMS.map((r) => r.id) }).storage.toNumber();
    expect(READY_SLOTS.length).toBeGreaterThanOrEqual(storage);
  });

  it('has a spot downstairs for every decoration: on the wall or on the floor, clear of the furniture and of each other', () => {
    const spots = DECORATIONS.map((d) => DECOR_SPOTS[d.id]);
    expect(spots.every((s) => s !== undefined)).toBe(true);
    const rects = spots.filter((s): s is Rect => s !== undefined);
    const apart = (a: Rect, b: Rect): boolean => a.x + a.w <= b.x || b.x + b.w <= a.x || a.y + a.h <= b.y || b.y + b.h <= a.y;
    for (const rect of rects) {
      expect(inside(rect, BUILDING)).toBe(true);
      expect(rect.y).toBeGreaterThan(UPPER_FLOOR_Y);
      expect(rect.y + rect.h <= FLOOR_Y || (rect.y >= FLOOR_Y && rect.y + rect.h <= GROUND_Y)).toBe(true);
      for (const thing of [SHELF, DOOR, BAR, CAULDRON]) expect(apart(rect, thing)).toBe(true);
    }
    rects.forEach((a, i) => rects.slice(i + 1).forEach((b) => expect(apart(a, b)).toBe(true)));
  });
});
