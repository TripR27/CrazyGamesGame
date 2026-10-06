import { describe, expect, it, vi } from 'vitest';
import { createEventBus } from '@/core/events';
import type { GameEvents } from '@/core/game-events';
import { createStore } from '@/core/store';
import { watchReputationLevels, type LevelState } from '@/systems/reputation';

function setup(reputation: number) {
  const store = createStore<LevelState>({ reputation });
  const bus = createEventBus<GameEvents>();
  const levelUps = vi.fn();
  const saves = vi.fn();
  bus.on('reputation:levelUp', levelUps);
  bus.on('saveRequested', saves);
  watchReputationLevels(store, bus);
  const gain = (n: number): void => store.update((s) => void (s.reputation += n));
  return { levelUps, saves, gain };
}

describe('watching reputation levels', () => {
  it('announces a new level once, exactly at the threshold', () => {
    const { levelUps, saves, gain } = setup(35);
    gain(4);
    expect(levelUps).not.toHaveBeenCalled();
    gain(1); // 40: Cozy Inn
    expect(levelUps).toHaveBeenCalledWith({ level: 3 });
    expect(saves).toHaveBeenCalled();
    gain(10);
    expect(levelUps).toHaveBeenCalledTimes(1);
  });

  it('announces every level on the way after a big jump', () => {
    const { levelUps, gain } = setup(0);
    gain(300);
    expect(levelUps.mock.calls.map(([e]) => e.level)).toEqual([2, 3, 4, 5]);
  });

  it('says nothing about a level the save had already reached', () => {
    const { levelUps, gain } = setup(60);
    gain(1);
    expect(levelUps).not.toHaveBeenCalled();
  });
});
