import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { num } from '@/core/numbers';
import { createInitialState } from '@/core/state';
import { createMemoryAdapter } from '@/save/memory-adapter';
import { SAVE_KEY } from '@/save/save-manager';
import { setup } from './helpers';

describe('save manager', () => {
  it('starts a new game when nothing is stored', () => {
    const { manager } = setup();
    const result = manager.load();

    expect(result.status).toBe('new');
    expect(result.state.meta.createdAt).toBe(2_000);
  });

  it('round-trips a saved game, including huge gold', () => {
    const { manager } = setup();
    const state = createInitialState(1);
    state.currencies.gold = num('1.5e500');
    state.reputation = 9;

    manager.save(state);
    const result = manager.load();

    expect(result.status).toBe('loaded');
    expect(result.state.currencies.gold.eq('1.5e500')).toBe(true);
    expect(result.state.reputation).toBe(9);
    expect(result.state.meta.createdAt).toBe(1);
  });

  it('loads a pinned v1 save fixture', () => {
    const storage = createMemoryAdapter();
    storage.setItem(SAVE_KEY, readFileSync(new URL('../fixtures/save-v1.json', import.meta.url), 'utf8'));

    const result = setup(storage).manager.load();

    expect(result.status).toBe('loaded');
    expect(result.state.currencies.gold.eq('1.5e500')).toBe(true);
    expect(result.state.reputation).toBe(7);
    expect(result.state.meta.lastSeenAt).toBe(1_700_000_000_000);
  });

  it('fills fields that an older save does not have', () => {
    const storage = createMemoryAdapter();
    storage.setItem(SAVE_KEY, '{"version":1,"savedAt":1,"state":{"meta":{"createdAt":5,"lastSeenAt":6}}}');

    const result = setup(storage).manager.load();

    expect(result.status).toBe('loaded');
    expect(result.state.meta.createdAt).toBe(5);
    expect(result.state.currencies.gold.eq(0)).toBe(true);
  });

  it.each([
    ['not json', '{broken'],
    ['wrong shape', '{"hello":"world"}'],
    ['a newer version', '{"version":99,"savedAt":1,"state":{}}'],
  ])('recovers from %s and keeps a backup', (_name, raw) => {
    const storage = createMemoryAdapter();
    storage.setItem(SAVE_KEY, raw);

    const result = setup(storage).manager.load();

    expect(result.status).toBe('recovered');
    expect(storage.getItem(`${SAVE_KEY}_backup`)).toBe(raw);
    expect(result.state.currencies.gold.eq(0)).toBe(true);
  });
});
