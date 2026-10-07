import { describe, expect, it, vi } from 'vitest';
import { num } from '@/shared/numbers';
import { createStore } from '@/shared/state';
import { applyOffline, type OfflineState } from '@/systems/offline/apply';
import { createOfflineInbox } from '@/systems/offline/inbox';
import type { OfflineReport } from '@/systems/offline/types';

const report = (over: Partial<OfflineReport> = {}): OfflineReport => ({
  awayMs: 1000, countedMs: 1000, capped: false, limitHours: 2, hadStaff: true, served: 4, gold: num(80), reputation: 4, ...over,
});

describe('paying out offline earnings', () => {
  it('adds the gold and the reputation', () => {
    const store = createStore<OfflineState>({ currencies: { gold: num(10) }, reputation: 1 });
    applyOffline(store, report());
    expect(store.getState().currencies.gold.toNumber()).toBe(90);
    expect(store.getState().reputation).toBe(5);
  });

  it('changes nothing, and notifies nobody, when nothing was earned', () => {
    const store = createStore<OfflineState>({ currencies: { gold: num(10) }, reputation: 1 });
    const seen = vi.fn();
    store.subscribe(seen);
    applyOffline(store, report({ served: 0, gold: num(0), reputation: 0 }));
    expect(seen).not.toHaveBeenCalled();
  });
});

describe('the offline inbox', () => {
  it('hands a waiting report over once', () => {
    const inbox = createOfflineInbox();
    expect(inbox.take()).toBeNull();
    inbox.post(report());
    expect(inbox.take()?.served).toBe(4);
    expect(inbox.take()).toBeNull();
  });

  it('tells subscribers about new reports until they unsubscribe', () => {
    const inbox = createOfflineInbox();
    const seen = vi.fn();
    const stop = inbox.subscribe(seen);
    inbox.post(report());
    stop();
    inbox.post(report());
    expect(seen).toHaveBeenCalledTimes(1);
  });
});
