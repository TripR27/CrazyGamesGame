import { describe, expect, it, vi } from 'vitest';
import { customers } from '@/customers/customer-data';
import { type ReputationLevel, levelFor, levelProgress, recipesUnlockedUpTo, watchReputationLevels, type LevelState } from '@/reputation/reputation';
import { toLevelUpView } from '@/reputation/level-up-model';
import { createEventBus, type GameEvents } from '@/shared/events';
import { createStore } from '@/shared/state';

const LEVELS: readonly ReputationLevel[] = [
  { id: 'one', minReputation: 0 },
  { id: 'two', minReputation: 10, unlocks: ['a'] },
  { id: 'three', minReputation: 30, unlocks: ['b', 'c'] },
];

describe('reputation levels', () => {
  it('start at level 1 and go up exactly at each threshold', () => {
    expect(levelFor(0, LEVELS)).toBe(1);
    expect(levelFor(9.9, LEVELS)).toBe(1);
    expect(levelFor(10, LEVELS)).toBe(2);
    expect(levelFor(29, LEVELS)).toBe(2);
    expect(levelFor(30, LEVELS)).toBe(3);
    expect(levelFor(1e9, LEVELS)).toBe(3);
  });

  it('show how far the player is towards the next level, and a full bar at the top', () => {
    expect(levelProgress(0, LEVELS)).toMatchObject({ level: 1, fraction: 0, next: { id: 'two' } });
    expect(levelProgress(20, LEVELS)).toMatchObject({ level: 2, fraction: 0.5, current: { id: 'two' } });
    expect(levelProgress(500, LEVELS)).toMatchObject({ level: 3, fraction: 1, next: undefined });
  });

  it('list the recipes every level up to this one teaches', () => {
    expect(recipesUnlockedUpTo(1, LEVELS)).toEqual([]);
    expect(recipesUnlockedUpTo(3, LEVELS)).toEqual(['a', 'b', 'c']);
  });

  it('use the game levels by default: the elf level at 10, the dwarf level at 40', () => {
    expect(levelFor(10)).toBe(2);
    expect(levelFor(40)).toBe(3);
  });
});

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

describe('the level-up message', () => {
  it('names the new level and what it brings, keeping new recipe names a secret', () => {
    expect(toLevelUpView(3, customers)).toEqual({
      title: 'Level up! Cozy Inn',
      lines: [
        'New customer: Thirsty Dwarf',
        'New customer: King Grumblebeard',
        'New in the shop: Moon Grape',
        'New recipes to discover: 2. Check the recipe book!',
      ],
    });
  });

  it('has just the title for a level that brings nothing new', () => {
    const levels = [{ id: 'shabby_shack', minReputation: 0 }, { id: 'local_haunt', minReputation: 5 }];
    expect(toLevelUpView(2, [], levels, [])).toEqual({ title: 'Level up! Local Haunt', lines: [] });
  });

  it('is empty for a level that does not exist', () => {
    expect(toLevelUpView(42, customers)).toEqual({ title: '', lines: [] });
  });
});
