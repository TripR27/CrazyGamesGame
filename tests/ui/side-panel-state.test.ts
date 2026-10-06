import { describe, expect, it } from 'vitest';
import { createPanelState } from '@/ui/side-panel-state';

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
