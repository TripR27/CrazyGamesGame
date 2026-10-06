import { describe, expect, it } from 'vitest';
import { arrowPlacement, spotlightBounds, SPOT_PADDING } from '@/ui/tutorial/placement';

describe('tutorial placement', () => {
  const target = { x: 400, y: 300, w: 100, h: 50 };

  it('pads the spotlight around the target', () => {
    expect(spotlightBounds(target)).toEqual({
      x: 400 - SPOT_PADDING,
      y: 300 - SPOT_PADDING,
      w: 100 + SPOT_PADDING * 2,
      h: 50 + SPOT_PADDING * 2,
    });
  });

  it('puts the arrow above the target, centred, pointing down', () => {
    const arrow = arrowPlacement(target);
    expect(arrow.points).toBe('down');
    expect(arrow.x + 17).toBe(450);
    expect(arrow.y + 34).toBe(300 - SPOT_PADDING);
  });

  it('puts the arrow below targets near the top of the screen, pointing up', () => {
    const arrow = arrowPlacement({ x: 20, y: 12, w: 140, h: 40 });
    expect(arrow.points).toBe('up');
    expect(arrow.y).toBe(12 - SPOT_PADDING + 40 + SPOT_PADDING * 2);
  });
});
