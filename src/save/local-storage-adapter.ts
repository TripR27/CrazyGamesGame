import { createMemoryAdapter } from '@/save/memory-adapter';
import type { StorageAdapter } from '@/save/storage';

const PROBE_KEY = '__bt_probe__';

function usableStorage(candidate?: Storage): Storage | null {
  try {
    const storage = candidate ?? globalThis.localStorage;
    storage.setItem(PROBE_KEY, '1');
    storage.removeItem(PROBE_KEY);
    return storage;
  } catch {
    return null;
  }
}

/** localStorage-backed adapter; falls back to memory when storage is blocked (private mode, sandbox). */
export function createLocalStorageAdapter(candidate?: Storage): StorageAdapter {
  const storage = usableStorage(candidate);
  if (storage === null) return createMemoryAdapter();
  return {
    getItem: (key) => storage.getItem(key),
    setItem: (key, value) => storage.setItem(key, value),
    removeItem: (key) => storage.removeItem(key),
  };
}
