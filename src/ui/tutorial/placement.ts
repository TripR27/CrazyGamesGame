import type { Bounds } from '@/shared/targets';

export const SPOT_PADDING = 10;
const ARROW_SIZE = 34;
/** Targets this close to the top get the arrow below them instead of above. */
const MIN_ROOM_ABOVE = 90;

export function spotlightBounds(target: Bounds): Bounds {
  return {
    x: target.x - SPOT_PADDING,
    y: target.y - SPOT_PADDING,
    w: target.w + SPOT_PADDING * 2,
    h: target.h + SPOT_PADDING * 2,
  };
}

export interface ArrowPlacement {
  x: number;
  y: number;
  /** Which way the arrow points: down when it sits above the target, up when it sits below. */
  points: 'down' | 'up';
}

/** The arrow floats above the target, or below it when there is no room above. */
export function arrowPlacement(target: Bounds): ArrowPlacement {
  const spot = spotlightBounds(target);
  const x = target.x + target.w / 2 - ARROW_SIZE / 2;
  if (spot.y >= MIN_ROOM_ABOVE) return { x, y: spot.y - ARROW_SIZE, points: 'down' };
  return { x, y: spot.y + spot.h, points: 'up' };
}
