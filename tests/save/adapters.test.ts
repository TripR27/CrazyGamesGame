import { describe, expect, it } from 'vitest';
import { fromBase64, toBase64 } from '@/save/base64';
import { SaveError } from '@/save/errors';
import { createLocalStorageAdapter } from '@/save/local-storage-adapter';
import { createMemoryAdapter } from '@/save/memory-adapter';

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
