import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { createLocalStorageAdapter } from '@/shared/browser';
import { num } from '@/shared/numbers';
import { createMemoryAdapter, createSaveManager, type StorageAdapter, decode, encode, SaveError, CURRENT_SAVE_VERSION, migrateState, type Migration, reconcile, SAVE_KEY, fromBase64, toBase64 } from '@/shared/save';
import { createInitialState, type GameState } from '@/shared/state';
import type { Clock } from '@/shared/time';

export const clock: Clock = { now: () => 2_000 };

export function setup(storage: StorageAdapter = createMemoryAdapter()) {
  const manager = createSaveManager<GameState>({ storage, clock, createDefault: createInitialState });
  return { storage, manager };
}

describe('codec', () => {
  it('round-trips plain values', () => {
    const value = { a: 1, b: 'text', c: [1, 2, 3], d: { e: true, f: null } };
    expect(decode(encode(value))).toEqual(value);
  });

  it('round-trips Decimal values anywhere in the tree, even huge ones', () => {
    const value = { gold: num('1.5e500'), nested: { list: [num(5), num('1e9999')] } };
    const result = decode(encode(value)) as typeof value;

    expect(result.gold.eq('1.5e500')).toBe(true);
    expect(result.nested.list[0]?.eq(5)).toBe(true);
    expect(result.nested.list[1]?.eq('1e9999')).toBe(true);
  });

  it('stores Decimals as tagged strings', () => {
    expect(encode({ gold: num(5) })).toBe('{"gold":{"$num":"5"}}');
  });

  it('throws on invalid JSON', () => {
    expect(() => decode('{nope')).toThrow();
  });
});

const migrations: Record<number, Migration> = {
  1: (state) => ({ ...state, addedInV2: true }),
  2: (state) => ({ ...state, addedInV3: true }),
};

describe('migrateState', () => {
  it('returns the state untouched when already current', () => {
    const state = { a: 1 };
    expect(migrateState(CURRENT_SAVE_VERSION, state)).toBe(state);
  });

  it('runs every migration step from the saved version to the target', () => {
    expect(migrateState(1, { a: 1 }, migrations, 3)).toEqual({ a: 1, addedInV2: true, addedInV3: true });
    expect(migrateState(2, { a: 1 }, migrations, 3)).toEqual({ a: 1, addedInV3: true });
  });

  it('rejects saves from a newer version without touching them', () => {
    expect(() => migrateState(5, {}, migrations, 3)).toThrow(SaveError);
    try {
      migrateState(5, {}, migrations, 3);
    } catch (error) {
      expect((error as SaveError).reason).toBe('too-new');
    }
  });

  it('rejects invalid versions and missing migrations as corrupt', () => {
    for (const version of [0, -1, 1.5, Number.NaN]) {
      expect(() => migrateState(version, {}, migrations, 3)).toThrow(SaveError);
    }
    expect(() => migrateState(1, {}, {}, 2)).toThrow(/No migration/);
  });
});

const defaults = { gold: num(0), level: 1, name: 'tavern', nested: { flag: false, list: [1] }, owned: {} };

describe('reconcile', () => {
  it('uses saved values when they match the defaults types', () => {
    const result = reconcile(defaults, { gold: num(50), level: 3, name: 'inn', nested: { flag: true, list: [2, 3] } });

    expect(result.gold.eq(50)).toBe(true);
    expect(result.level).toBe(3);
    expect(result.name).toBe('inn');
    expect(result.nested).toEqual({ flag: true, list: [2, 3] });
  });

  it('fills fields missing from the save with defaults', () => {
    const result = reconcile(defaults, { level: 4 });

    expect(result.level).toBe(4);
    expect(result.name).toBe('tavern');
    expect(result.nested).toEqual({ flag: false, list: [1] });
  });

  it('drops fields that are not in the defaults', () => {
    const result = reconcile(defaults, { level: 2, removedFeature: 99 });
    expect('removedFeature' in result).toBe(false);
  });

  it('falls back to defaults on wrong types', () => {
    const result = reconcile(defaults, { gold: 'lots', level: '7', nested: 5, name: null });

    expect(result.gold.eq(0)).toBe(true);
    expect(result.level).toBe(1);
    expect(result.nested).toEqual({ flag: false, list: [1] });
    expect(result.name).toBe('tavern');
  });

  it('keeps open-ended maps (empty default objects) as saved', () => {
    const result = reconcile(defaults, { owned: { cauldron: 3, barrel: 1 } });
    expect(result.owned).toEqual({ cauldron: 3, barrel: 1 });
  });

  it('returns the defaults when the save is not an object', () => {
    expect(reconcile(defaults, 'garbage').level).toBe(1);
    expect(reconcile(defaults, null).name).toBe('tavern');
  });
});

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

describe('save manager transfer and failure handling', () => {
  it('exports and imports a game as a code', () => {
    const { manager } = setup();
    const state = createInitialState(1);
    state.currencies.gold = num('42e100');

    const imported = manager.importString(manager.exportString(state));

    expect(imported.currencies.gold.eq('42e100')).toBe(true);
  });

  it('rejects an invalid import code', () => {
    expect(() => setup().manager.importString('definitely not a save')).toThrow(SaveError);
  });

  it('does not throw when storage refuses to write', () => {
    const failing: StorageAdapter = {
      getItem: () => null,
      setItem: () => {
        throw new Error('quota exceeded');
      },
      removeItem: () => undefined,
    };
    expect(() => setup(failing).manager.save(createInitialState(1))).not.toThrow();
  });
});

function fakeStorage(): Storage {
  const data = new Map<string, string>();
  return {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => void data.set(key, value),
    removeItem: (key: string) => void data.delete(key),
  } as unknown as Storage;
}

describe('memory adapter', () => {
  it('stores, reads and removes items', () => {
    const adapter = createMemoryAdapter();
    expect(adapter.getItem('a')).toBeNull();
    adapter.setItem('a', '1');
    expect(adapter.getItem('a')).toBe('1');
    adapter.removeItem('a');
    expect(adapter.getItem('a')).toBeNull();
  });
});

describe('local storage adapter', () => {
  it('delegates to the given storage', () => {
    const storage = fakeStorage();
    const adapter = createLocalStorageAdapter(storage);
    adapter.setItem('k', 'v');
    expect(storage.getItem('k')).toBe('v');
    expect(adapter.getItem('k')).toBe('v');
  });

  it('falls back to memory when storage is blocked', () => {
    const blocked = {
      setItem: () => {
        throw new Error('blocked');
      },
    } as unknown as Storage;
    const adapter = createLocalStorageAdapter(blocked);
    adapter.setItem('k', 'v');
    expect(adapter.getItem('k')).toBe('v');
  });
});

describe('base64', () => {
  it('round-trips text including unicode', () => {
    const text = '{"name":"Taverne ☕ 🍺"}';
    expect(fromBase64(toBase64(text))).toBe(text);
  });

  it('rejects invalid codes as corrupt', () => {
    expect(() => fromBase64('%%%not base64%%%')).toThrow(SaveError);
  });
});
