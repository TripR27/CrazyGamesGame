import { describe, expect, it } from 'vitest';
import { GAME_HEIGHT, GAME_WIDTH } from '@/config';
import {
  BAR,
  BUILDING,
  CAULDRON,
  CUSTOMER_SLOTS,
  DOOR,
  FLOOR_Y,
  HUD_HEIGHT,
  TABLES,
  type Rect,
} from '@/scene/layout';

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
});
