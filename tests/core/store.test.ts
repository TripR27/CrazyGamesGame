import { describe, expect, it, vi } from 'vitest';
import { createInitialState } from '@/core/state';
import { createStore } from '@/core/store';

describe('createInitialState', () => {
  it('starts empty with the given timestamps', () => {
    const state = createInitialState(1234);
    expect(state.meta).toEqual({ createdAt: 1234, lastSeenAt: 1234 });
    expect(state.currencies.gold.eq(0)).toBe(true);
    expect(state.reputation).toBe(0);
  });
});

describe('store', () => {
  it('applies updates and notifies subscribers with the state', () => {
    const store = createStore({ count: 0 });
    const listener = vi.fn();
    store.subscribe(listener);

    store.update((state) => {
      state.count += 1;
    });

    expect(store.getState().count).toBe(1);
    expect(listener).toHaveBeenCalledWith({ count: 1 });
  });

  it('stops notifying after unsubscribe', () => {
    const store = createStore({ count: 0 });
    const listener = vi.fn();
    const off = store.subscribe(listener);

    off();
    store.update((state) => {
      state.count += 1;
    });

    expect(listener).not.toHaveBeenCalled();
  });
});
