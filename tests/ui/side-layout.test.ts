import { describe, expect, it, vi } from 'vitest';
import { computeFit } from '@/ui/fit-math';
import { createSideLayout, sidePanelWidth } from '@/ui/side-layout';

describe('side layout', () => {
  it('starts without a panel and tells listeners only when the width really changes', () => {
    const layout = createSideLayout();
    const seen = vi.fn();
    layout.subscribe(seen);
    expect(layout.width()).toBe(0);
    layout.setWidth(0);
    layout.setWidth(300);
    layout.setWidth(300);
    expect(layout.width()).toBe(300);
    expect(seen).toHaveBeenCalledTimes(1);
  });

  it('stops telling a listener that unsubscribed', () => {
    const layout = createSideLayout();
    const seen = vi.fn();
    layout.subscribe(seen)();
    layout.setWidth(100);
    expect(seen).not.toHaveBeenCalled();
  });

  it('keeps the panel at 360 px, but at most a third of a small window', () => {
    expect(sidePanelWidth(1920)).toBe(360);
    expect(sidePanelWidth(900)).toBe(297);
  });

  it('fits the game into what is left of the window next to the panel', () => {
    const fit = computeFit(1920 - 360, 1080, 1280, 720);
    expect(fit.scale).toBeCloseTo(1.21875, 4);
    expect(fit.left).toBeCloseTo(0, 4);
  });
});
