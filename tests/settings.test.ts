import { describe, expect, it, vi } from 'vitest';
import { newGame } from './flows/helpers';
import { hasKey } from '@/i18n/translator';
import { importGame, LANGUAGES, resetGame, setLanguage, setVolume } from '@/settings/settings';
import { num } from '@/shared/numbers';
import { createMemoryAdapter, createSaveManager } from '@/shared/save';
import { createInitialState, type GameState } from '@/shared/state';

describe('settings', () => {
  it('keep the volume between 0 and 1, and only languages the game has', () => {
    const g = newGame(createInitialState(0));
    setVolume(g.world, 0.35);
    expect(g.world.store.getState().settings.volume).toBe(0.35);
    setVolume(g.world, 7);
    expect(g.world.store.getState().settings.volume).toBe(1);
    setVolume(g.world, Number.NaN);
    expect(g.world.store.getState().settings.volume).toBe(0);
    setLanguage(g.world, 'xx');
    expect(g.world.store.getState().settings.language).toBe('en');
    for (const id of LANGUAGES) expect(hasKey(`settings.lang_${id}`)).toBe(true);
  });

  it('start over with a new game that keeps only the settings', () => {
    const state = createInitialState(0);
    state.currencies.gold = num(5000);
    state.settings.volume = 0.2;
    state.recipesDiscovered = [...state.recipesDiscovered, 'bog_lantern'];
    const g = newGame(state);
    const replaced = vi.fn();
    g.world.bus.on('game:replaced', replaced);
    resetGame(g.world);
    const after = g.world.store.getState();
    expect(after.currencies.gold.toNumber()).toBe(0);
    expect(after.recipesDiscovered).not.toContain('bog_lantern');
    expect(after.settings.volume).toBe(0.2);
    expect(replaced).toHaveBeenCalledTimes(1);
  });

  it('load a save exported as text, and refuse text that is not a save', () => {
    const manager = createSaveManager<GameState>({ storage: createMemoryAdapter(), clock: { now: () => 0 }, createDefault: createInitialState });
    const other = createInitialState(0);
    other.currencies.gold = num(1234);
    other.reputation = 77;
    const code = manager.exportString(other);
    const g = newGame(createInitialState(0));
    importGame(g.world, manager.importString(code));
    expect(g.world.store.getState().currencies.gold.toNumber()).toBe(1234);
    expect(g.world.store.getState().reputation).toBe(77);
    expect(() => manager.importString('not a save')).toThrow();
  });
});
