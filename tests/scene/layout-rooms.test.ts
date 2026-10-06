import { describe, expect, it } from 'vitest';
import { ROOMS } from '@/data/rooms';
import { upgrades } from '@/data/upgrades';
import { getMultipliers } from '@/systems/economy';
import { totalSeats } from '@/systems/rooms';
import { BUILDING, CUSTOMER_SLOTS, HUD_HEIGHT, READY_SLOTS, SHELF, type Rect } from '@/scene/layout';
import { ROOM_SPOTS, SEAT_SLOTS, UPPER_FLOOR_Y } from '@/scene/layout-rooms';

const inside = (inner: Rect, outer: Rect): boolean =>
  inner.x >= outer.x && inner.y >= outer.y && inner.x + inner.w <= outer.x + outer.w && inner.y + inner.h <= outer.y + outer.h;

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
});
