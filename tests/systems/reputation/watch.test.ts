import { describe, expect, it, vi } from 'vitest';
import { createEventBus } from '@/core/events';
import type { GameEvents } from '@/core/game-events';
import { createStore } from '@/core/store';
import { watchReputationLevels, type LevelState } from '@/systems/reputation';

function setup(reputation: number, recipesDiscovered: string[] = []) {
  const store = createStore<LevelState>({ reputation, recipesDiscovered });
  const bus = createEventBus<GameEvents>();
  const levelUps = vi.fn();
  const saves = vi.fn();
  bus.on('reputation:levelUp', levelUps);
  bus.on('saveRequested', saves);
  watchReputationLevels(store, bus);
  const gain = (n: number): void => store.update((s) => void (s.reputation += n));
  return { store, levelUps, saves, gain };
}

describe('watching reputation levels', () => {
  it('announces a new level once, and teaches its recipes', () => {
    const { store, levelUps, gain } = setup(20);
    gain(4);
    expect(levelUps).not.toHaveBeenCalled();
    gain(1); // 25: level 3 teaches Dragon's Hiccup
    expect(levelUps).toHaveBeenCalledWith({ level: 3 });
    expect(store.getState().recipesDiscovered).toContain('dragons_hiccup');
    gain(10);
    expect(levelUps).toHaveBeenCalledTimes(1);
  });

  it('announces every level on the way after a big jump, and asks for a save', () => {
    const { store, levelUps, saves, gain } = setup(0);
    gain(120);
    expect(levelUps.mock.calls.map(([e]) => e.level)).toEqual([2, 3, 4, 5]);
    expect(store.getState().recipesDiscovered).toEqual(['dragons_hiccup', 'moonlight_merlot', 'trolls_toll']);
    expect(saves).toHaveBeenCalled();
  });

  it('catches up quietly with a save that is already past a level, without a message', () => {
    const { store, levelUps } = setup(60, ['slime_sap']);
    expect(store.getState().recipesDiscovered).toEqual(['slime_sap', 'dragons_hiccup', 'moonlight_merlot']);
    expect(levelUps).not.toHaveBeenCalled();
  });

  it('never teaches a recipe twice', () => {
    const { store, gain } = setup(0, ['dragons_hiccup']);
    gain(30);
    expect(store.getState().recipesDiscovered.filter((id) => id === 'dragons_hiccup')).toHaveLength(1);
  });
});
