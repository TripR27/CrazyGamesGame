import { describe, expect, it } from 'vitest';
import { SaveError } from '@/save/errors';
import { CURRENT_SAVE_VERSION, migrateState, type Migration } from '@/save/migrate';

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
