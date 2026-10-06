import type { Clock } from '@/core/clock';
import { debug } from '@/core/debug';
import { fromBase64, toBase64 } from '@/save/base64';
import { packEnvelope, unpackEnvelope } from '@/save/envelope';
import { SaveError } from '@/save/errors';
import { migrateState } from '@/save/migrate';
import { reconcile } from '@/save/reconcile';
import type { StorageAdapter } from '@/save/storage';

export const SAVE_KEY = 'bt_save';

/** 'recovered' means the stored save was unreadable; it was kept as a backup and a new game started. */
export type LoadStatus = 'new' | 'loaded' | 'recovered';

export interface LoadResult<S> {
  state: S;
  status: LoadStatus;
}

export interface SaveManager<S> {
  load(): LoadResult<S>;
  save(state: S): void;
  exportString(state: S): string;
  /** Throws SaveError when the code is not a valid save. */
  importString(code: string): S;
}

export interface SaveManagerOptions<S> {
  storage: StorageAdapter;
  clock: Clock;
  createDefault: (now: number) => S;
  key?: string;
}

export function createSaveManager<S>(options: SaveManagerOptions<S>): SaveManager<S> {
  const { storage, clock, createDefault } = options;
  const key = options.key ?? SAVE_KEY;

  const parse = (text: string): S => {
    const envelope = unpackEnvelope(text);
    const migrated = migrateState(envelope.version, envelope.state);
    return reconcile(createDefault(clock.now()), migrated);
  };

  return {
    load() {
      const raw = storage.getItem(key);
      if (raw === null) return { state: createDefault(clock.now()), status: 'new' };
      try {
        return { state: parse(raw), status: 'loaded' };
      } catch (error) {
        if (!(error instanceof SaveError)) throw error;
        debug('unreadable save, keeping a backup', error.message);
        storage.setItem(`${key}_backup`, raw);
        return { state: createDefault(clock.now()), status: 'recovered' };
      }
    },
    save(state) {
      try {
        storage.setItem(key, packEnvelope(state, clock.now()));
      } catch (error) {
        debug('save failed', error);
      }
    },
    exportString: (state) => toBase64(packEnvelope(state, clock.now())),
    importString: (code) => parse(fromBase64(code)),
  };
}
