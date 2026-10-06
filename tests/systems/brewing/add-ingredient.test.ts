import { describe, expect, it } from 'vitest';
import { addIngredient, canGrow, matchRecipe } from '@/systems/brewing';
import { ab, cde, recipes, rng, station } from '../fixtures';

describe('matching ingredients to recipes', () => {
  it('matches the exact set in any order', () => {
    expect(matchRecipe(['a', 'b'], recipes)).toBe(ab);
    expect(matchRecipe(['b', 'a'], recipes)).toBe(ab);
    expect(matchRecipe(['e', 'c', 'd'], recipes)).toBe(cde);
  });

  it('does not match partial, extra or duplicate sets', () => {
    expect(matchRecipe(['a'], recipes)).toBeUndefined();
    expect(matchRecipe(['a', 'b', 'c'], recipes)).toBeUndefined();
    expect(matchRecipe(['a', 'a'], recipes)).toBeUndefined();
  });

  it('knows whether a combination can still grow into a recipe', () => {
    expect(canGrow(['c'], recipes)).toBe(true);
    expect(canGrow(['c', 'd'], recipes)).toBe(true);
    expect(canGrow(['a', 'c'], recipes)).toBe(false);
    expect(canGrow(['a', 'a'], recipes)).toBe(false);
    expect(canGrow(['z'], recipes)).toBe(false);
  });
});

describe('adding an ingredient', () => {
  it('waits quietly while the combination is incomplete', () => {
    const s = station();
    expect(addIngredient(s, 'c', recipes, rng())).toEqual([]);
    expect(addIngredient(s, 'd', recipes, rng())).toEqual([]);
    expect(s.contents).toEqual(['c', 'd']);
  });

  it('starts brewing the moment a known recipe is complete, whatever the order', () => {
    const s = station();
    addIngredient(s, 'b', recipes, rng());
    expect(addIngredient(s, 'a', recipes, rng())).toEqual([{ kind: 'started', recipeId: 'ab' }]);
    expect(s.contents).toEqual([]);
    expect(s.brewing).toEqual({ recipeId: 'ab', remainingMs: 2000, totalMs: 2000 });
  });

  it('starts a three-ingredient recipe on the third ingredient', () => {
    const s = station();
    for (const id of ['c', 'd']) addIngredient(s, id, recipes, rng());
    expect(addIngredient(s, 'e', recipes, rng())).toEqual([{ kind: 'started', recipeId: 'cde' }]);
  });

  it('fizzles at once when the combination cannot become a recipe', () => {
    const s = station();
    addIngredient(s, 'a', recipes, rng());
    const events = addIngredient(s, 'c', recipes, rng());
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({ kind: 'notice', notice: 'fizzle' });
    expect(s.contents).toEqual([]);
    expect(s.brewing).toBeNull();
  });

  it('fizzles on a repeated ingredient and on an ingredient no recipe uses', () => {
    const s = station();
    addIngredient(s, 'a', recipes, rng());
    expect(addIngredient(s, 'a', recipes, rng())[0]).toMatchObject({ notice: 'fizzle' });
    expect(addIngredient(s, 'zzz', recipes, rng())[0]).toMatchObject({ notice: 'fizzle' });
  });

  it('only brews recipes the player knows', () => {
    const s = station();
    addIngredient(s, 'a', [], rng());
    expect(s.brewing).toBeNull();
    expect(s.contents).toEqual([]);
  });

  it('says the cauldron is busy while brewing and leaves everything as it was', () => {
    const s = station();
    addIngredient(s, 'a', recipes, rng());
    addIngredient(s, 'b', recipes, rng());
    const events = addIngredient(s, 'c', recipes, rng());
    expect(events[0]).toMatchObject({ kind: 'notice', notice: 'busy' });
    expect(s.brewing?.recipeId).toBe('ab');
    expect(s.contents).toEqual([]);
  });

  it('says the bar is full when there is no room for another drink', () => {
    const s = station(2);
    s.ready.push('ab', 'ab');
    const events = addIngredient(s, 'a', recipes, rng());
    expect(events[0]).toMatchObject({ kind: 'notice', notice: 'full' });
    expect(s.contents).toEqual([]);
  });

  it('uses a message line from the matching feedback pool', () => {
    const s = station();
    addIngredient(s, 'a', recipes, rng());
    const [event] = addIngredient(s, 'c', recipes, rng());
    expect(event).toMatchObject({ messageKey: expect.stringMatching(/^feedback\.fizzle\.[1-3]$/) });
  });
});
