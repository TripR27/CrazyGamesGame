import { describe, expect, it } from 'vitest';
import { num } from '@/core/numbers';
import { createInitialState } from '@/core/state';
import { SaveError } from '@/save/errors';
import type { StorageAdapter } from '@/save/storage';
import { setup } from './helpers';

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
