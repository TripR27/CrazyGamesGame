import Decimal from 'break_infinity.js';
import { debug } from '@/shared/events';
import { parseNum } from '@/shared/numbers';
import type { Clock } from '@/shared/time';

export function toBase64(text: string): string {
  const bytes = new TextEncoder().encode(text);
  return btoa(Array.from(bytes, (byte) => String.fromCharCode(byte)).join(''));
}

export function fromBase64(encoded: string): string {
  try {
    const binary = atob(encoded.trim());
    return new TextDecoder('utf-8', { fatal: true }).decode(Uint8Array.from(binary, (c) => c.charCodeAt(0)));
  } catch {
    throw new SaveError('corrupt', 'Export code is not valid');
  }
}

const NUM_TAG = '$num';

type TaggedNum = { [NUM_TAG]: string };

function isTaggedNum(value: unknown): value is TaggedNum {
  if (typeof value !== 'object' || value === null) return false;
  const keys = Object.keys(value);
  return keys.length === 1 && keys[0] === NUM_TAG && typeof (value as TaggedNum)[NUM_TAG] === 'string';
}

/** JSON-encode any state; Decimal values become tagged strings, so new state slices need no extra code. */
export function encode(value: unknown): string {
  return JSON.stringify(value, function (this: Record<string, unknown>, key: string, json: unknown) {
    const original = this[key];
    return original instanceof Decimal ? { [NUM_TAG]: original.toString() } : json;
  });
}

export function decode(text: string): unknown {
  return JSON.parse(text, (_key, value: unknown) => (isTaggedNum(value) ? parseNum(value[NUM_TAG]) : value));
}

export interface SaveEnvelope {
  version: number;
  savedAt: number;
  state: RawState;
}

export function packEnvelope(state: unknown, savedAt: number): string {
  return encode({ version: CURRENT_SAVE_VERSION, savedAt, state });
}

export function unpackEnvelope(text: string): SaveEnvelope {
  let data: unknown;
  try {
    data = decode(text);
  } catch {
    throw new SaveError('corrupt', 'Save is not valid JSON');
  }
  const envelope = data as Partial<SaveEnvelope> | null;
  const state = envelope?.state;
  if (typeof envelope?.version !== 'number' || typeof state !== 'object' || state === null) {
    throw new SaveError('corrupt', 'Save has an unexpected shape');
  }
  return { version: envelope.version, savedAt: Number(envelope.savedAt) || 0, state: state as RawState };
}

export type SaveErrorReason = 'corrupt' | 'too-new';

export class SaveError extends Error {
  readonly reason: SaveErrorReason;

  constructor(reason: SaveErrorReason, message: string) {
    super(message);
    this.name = 'SaveError';
    this.reason = reason;
  }
}

export const CURRENT_SAVE_VERSION = 1;

export type RawState = Record<string, unknown>;
export type Migration = (state: RawState) => RawState;

/** Migrations keyed by the version they upgrade FROM (key 1 upgrades version 1 to 2). */
export const MIGRATIONS: Readonly<Record<number, Migration>> = {};

export function migrateState(
  version: number,
  state: RawState,
  migrations: Readonly<Record<number, Migration>> = MIGRATIONS,
  target: number = CURRENT_SAVE_VERSION,
): RawState {
  if (!Number.isInteger(version) || version < 1) {
    throw new SaveError('corrupt', `Invalid save version: ${version}`);
  }
  if (version > target) {
    throw new SaveError('too-new', `Save version ${version} is newer than ${target}`);
  }
  let current = state;
  for (let from = version; from < target; from += 1) {
    const migration = migrations[from];
    if (migration === undefined) throw new SaveError('corrupt', `No migration from version ${from}`);
    current = migration(current);
  }
  return current;
}

type Plain = Record<string, unknown>;

const isPlain = (value: unknown): value is Plain =>
  typeof value === 'object' && value !== null && !Array.isArray(value) && !(value instanceof Decimal);

function reconcilePlain(defaults: Plain, saved: unknown): Plain {
  if (!isPlain(saved)) return defaults;
  // An empty object in the defaults is an open-ended map (e.g. upgrade levels): keep saved entries as they are.
  if (Object.keys(defaults).length === 0) return saved;
  const result: Plain = {};
  for (const key of Object.keys(defaults)) result[key] = reconcile(defaults[key], saved[key]);
  return result;
}

/**
 * Merge a loaded save into the defaults: missing fields get defaults, unknown fields are dropped,
 * and values of the wrong type fall back to the default. Makes new fields safe to add.
 */
export function reconcile<T>(defaults: T, saved: unknown): T {
  if (isPlain(defaults)) return reconcilePlain(defaults, saved) as T;
  if (defaults instanceof Decimal) return (saved instanceof Decimal ? saved : defaults) as T;
  if (Array.isArray(defaults)) return (Array.isArray(saved) ? saved : defaults) as T;
  if (defaults === null) return saved as T;
  return (typeof saved === typeof defaults ? saved : defaults) as T;
}

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

/** Synchronous key-value storage; same shape as localStorage and the CrazyGames data module. */
export interface StorageAdapter {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export function createMemoryAdapter(): StorageAdapter {
  const items = new Map<string, string>();
  return {
    getItem: (key) => items.get(key) ?? null,
    setItem: (key, value) => void items.set(key, value),
    removeItem: (key) => void items.delete(key),
  };
}
