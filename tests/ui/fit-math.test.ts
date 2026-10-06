import { describe, expect, it } from 'vitest';
import { computeFit } from '@/ui/fit-math';

describe('computeFit', () => {
  it('scales 1:1 when the viewport equals the design size', () => {
    expect(computeFit(1280, 720, 1280, 720)).toEqual({ scale: 1, left: 0, top: 0 });
  });

  it('letterboxes top and bottom in a tall viewport', () => {
    const fit = computeFit(1024, 768, 1280, 720);
    expect(fit.scale).toBeCloseTo(0.8, 5);
    expect(fit.left).toBeCloseTo(0, 5);
    expect(fit.top).toBeCloseTo(96, 5);
  });

  it('pillarboxes left and right in a wide viewport', () => {
    const fit = computeFit(2000, 720, 1280, 720);
    expect(fit.scale).toBe(1);
    expect(fit.left).toBe(360);
    expect(fit.top).toBe(0);
  });

  it('scales up on a large screen', () => {
    expect(computeFit(2560, 1440, 1280, 720).scale).toBe(2);
  });
});
