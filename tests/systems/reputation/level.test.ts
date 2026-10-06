import { describe, expect, it } from 'vitest';
import type { ReputationLevel } from '@/data/reputation/levels';
import { levelFor, levelProgress, recipesUnlockedUpTo } from '@/systems/reputation';

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

  it('use the game levels by default: the elf level at 10, the dwarf level at 25', () => {
    expect(levelFor(10)).toBe(2);
    expect(levelFor(25)).toBe(3);
  });
});
