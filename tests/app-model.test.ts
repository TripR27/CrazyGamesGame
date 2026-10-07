import { describe, expect, it, vi } from 'vitest';
import { computeFit, toHudView, createSideLayout, SHOP_PANEL_WIDTH, createPanelState } from '@/app/ui-model';
import { num } from '@/shared/numbers';

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

describe('toHudView', () => {
  it('shows a fresh game as zeros', () => {
    expect(toHudView({ currencies: { gold: num(0) }, reputation: 0 })).toEqual({
      gold: '0',
      reputation: '0',
      level: 'Shabby Shack',
      levelFraction: 0,
    });
  });

  it('shows the reputation level and how far it is to the next one', () => {
    expect(toHudView({ currencies: { gold: num(0) }, reputation: 25 })).toMatchObject({ level: 'Local Haunt', levelFraction: 0.5 });
    expect(toHudView({ currencies: { gold: num(0) }, reputation: 999 })).toMatchObject({ level: 'Legendary Hall', levelFraction: 1 });
  });

  it('formats gold with idle-game suffixes', () => {
    expect(toHudView({ currencies: { gold: num(1500) }, reputation: 3 }).gold).toBe('1.5K');
    expect(toHudView({ currencies: { gold: num('2.5e9') }, reputation: 3 }).gold).toBe('2.5B');
  });

  it('rounds reputation down to a whole number', () => {
    expect(toHudView({ currencies: { gold: num(0) }, reputation: 7.9 }).reputation).toBe('7');
  });
});

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

function panel() {
  const state = createPanelState();
  state.addTab('shop');
  state.addTab('recipes');
  return state;
}

describe('the side panel with tabs', () => {
  it('starts folded away, and the one button unfolds it on the first tab and folds it again', () => {
    const state = panel();
    expect(state.isOpen()).toBe(false);
    expect(state.toggle()).toEqual({ opened: 'shop' });
    expect(state.isOpen()).toBe(true);
    expect(state.toggle()).toEqual({ closed: 'shop' });
    expect(state.isOpen()).toBe(false);
  });

  it('switches tabs, closing the one that was on screen', () => {
    const state = panel();
    state.toggle();
    expect(state.select('recipes')).toEqual({ closed: 'shop', opened: 'recipes' });
    expect(state.select('recipes')).toEqual({});
    expect(state.active()).toBe('recipes');
  });

  it('unfolds on the tab that was used last', () => {
    const state = panel();
    state.toggle();
    state.select('recipes');
    state.toggle();
    expect(state.toggle()).toEqual({ opened: 'recipes' });
  });

  it('unfolds when a tab is picked while folded away, and does nothing without tabs', () => {
    expect(panel().select('recipes')).toEqual({ opened: 'recipes' });
    expect(createPanelState().toggle()).toEqual({});
  });
});
