import { describe, expect, it, vi } from 'vitest';
import { computeFit } from '@/ui/fit-math';
import { createSideLayout, SHOP_PANEL_WIDTH } from '@/ui/side-layout';

describe('side layout', () => {
  it('starts without a panel and tells listeners only when the width really changes', () => {
    const layout = createSideLayout();
    const seen = vi.fn();
    layout.subscribe(seen);
    expect(layout.width()).toBe(0);
    layout.setWidth(0);
    layout.setWidth(SHOP_PANEL_WIDTH);
    layout.setWidth(SHOP_PANEL_WIDTH);
    expect(layout.width()).toBe(SHOP_PANEL_WIDTH);
    expect(seen).toHaveBeenCalledTimes(1);
  });

  it('stops telling a listener that unsubscribed', () => {
    const layout = createSideLayout();
    const seen = vi.fn();
    layout.subscribe(seen)();
    layout.setWidth(100);
    expect(seen).not.toHaveBeenCalled();
  });
});

describe('game and panel as one frame', () => {
  const frameWidth = 1280 + SHOP_PANEL_WIDTH;

  it('fits both into a 16:9 window, so the panel is as tall as the game and nothing crosses a bar', () => {
    const fit = computeFit(1920, 1080, frameWidth, 720);
    const gameHeight = 720 * fit.scale;
    expect(fit.scale).toBeCloseTo(1920 / frameWidth, 5);
    expect(fit.top + gameHeight).toBeLessThanOrEqual(1080);
    expect(fit.left).toBeCloseTo(0, 5);
  });

  it('puts the same empty bars above and below game and panel in a tall window', () => {
    const fit = computeFit(1000, 1000, frameWidth, 720);
    expect(fit.top).toBeCloseTo(1000 - fit.top - 720 * fit.scale, 5);
  });
});
