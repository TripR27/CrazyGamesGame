import { describe, expect, it, vi } from 'vitest';
import { newGame } from './helpers';
import { DUNGEONS, GUILD_ROOM_ID, HEROES, clickHero, hireHeroById, newHero, sendHero } from '@/heroes/heroes';
import { buildRoomById } from '@/rooms/rooms';
import { clickReadyDrink } from '@/serving/serving';
import { num } from '@/shared/numbers';
import { decode, encode, reconcile } from '@/shared/save';
import { createInitialState, type GameState } from '@/shared/state';
import { resolveTarget, speech } from '@/tutorial/tutorial-guide';
import { TUTORIAL_STEPS } from '@/tutorial/tutorial-steps';

const TRIP_MS = (DUNGEONS[0]?.durationSeconds ?? 0) * 1000;

/** A wall clock the test moves by hand. */
function testClock(start = 1_000_000) {
  let now = start;
  return { now: () => now, advance: (ms: number) => void (now += ms) };
}

/** A save at Famous Tavern with gold to spend; `guild` also has the guild hall and the warrior. */
function famous(guild = false): GameState {
  const state = createInitialState(0);
  state.reputation = 300;
  state.currencies.gold = num(50_000);
  state.tutorial.skipped = true;
  if (guild) {
    state.roomsBuilt = [GUILD_ROOM_ID];
    state.heroes = { warrior: newHero() };
  }
  return state;
}

const stockTotal = (state: GameState): number => Object.values(state.ingredientStock).reduce((sum, n) => sum + n, 0);

describe('the guild hall brings the heroes', () => {
  it('moves the warrior in when the guild hall is built, and lets the player hire the mage', () => {
    const g = newGame(famous());
    const recruited = vi.fn();
    g.world.bus.on('hero:recruited', recruited);
    hireHeroById(g.world, 'mage');
    expect(g.state.heroes).toEqual({});
    buildRoomById(g.world, GUILD_ROOM_ID);
    expect(Object.keys(g.state.heroes)).toEqual(['warrior']);
    hireHeroById(g.world, 'mage');
    expect(Object.keys(g.state.heroes)).toEqual(['warrior', 'mage']);
    expect(g.state.currencies.gold.toNumber()).toBe(50_000 - 15_000 - 8_000);
    expect(recruited.mock.calls.map(([e]) => e.id)).toEqual(['warrior', 'mage']);
    expect(g.saves).toHaveBeenCalled();
  });
});

describe('an expedition to the swamp', () => {
  it('leaves, runs on the wall clock and comes back with dungeon ingredients and XP', () => {
    const clock = testClock();
    const g = newGame(famous(true), clock);
    const returned = vi.fn();
    g.world.bus.on('hero:returned', returned);
    sendHero(g.world, 'warrior');
    expect(g.state.heroes.warrior?.expedition).toEqual({ dungeon: 'swamp', endsAt: clock.now() + TRIP_MS });
    sendHero(g.world, 'warrior');
    clock.advance(TRIP_MS - 1);
    g.tick(100);
    expect(returned).not.toHaveBeenCalled();
    clock.advance(1);
    g.tick(100);
    expect(returned).toHaveBeenCalledTimes(1);
    expect(g.state.heroes.warrior).toMatchObject({ expedition: null, xp: DUNGEONS[0]?.xp });
    expect(stockTotal(g.state)).toBe(DUNGEONS[0]?.lootRolls);
  });

  it('comes back right after loading a save whose trip ended while the game was closed, rested already', () => {
    const clock = testClock();
    const first = newGame(famous(true), clock);
    sendHero(first.world, 'warrior');
    const saved = reconcile(createInitialState(0), decode(encode(first.state)));
    clock.advance(TRIP_MS + HEROES.restMs + 60_000);
    const second = newGame(saved, clock);
    second.tick(100);
    expect(second.state.heroes.warrior?.expedition).toBeNull();
    expect(stockTotal(second.state)).toBe(DUNGEONS[0]?.lootRolls);
    // Any injury started when they were back, so after the rest time they are fit again.
    expect(second.state.heroes.warrior?.injuredUntil ?? 0).toBeLessThanOrEqual(clock.now());
  });
});

describe('an injured hero', () => {
  it('rests, and a drink from the bar heals them at once', () => {
    const clock = testClock();
    const state = famous(true);
    state.heroes.warrior = { ...newHero(), injuredUntil: clock.now() + HEROES.restMs };
    const g = newGame(state, clock);
    sendHero(g.world, 'warrior');
    expect(g.state.heroes.warrior?.expedition).toBeNull();
    const healed = vi.fn();
    g.world.bus.on('hero:healed', healed);
    g.world.station.ready.push('slime_sap');
    clickReadyDrink(g.world, 0);
    clickHero(g.world, 'warrior');
    expect(healed).toHaveBeenCalledWith({ id: 'warrior', recipeId: 'slime_sap' });
    expect(g.world.station.ready).toEqual([]);
    expect(g.world.selection.selected()).toBeNull();
    sendHero(g.world, 'warrior');
    expect(g.state.heroes.warrior?.expedition).not.toBeNull();
  });

  it('opens the Heroes tab when clicked with nothing picked up; a healthy hero leaves a picked drink alone', () => {
    const g = newGame(famous(true));
    const requested = vi.fn();
    g.world.bus.on('heroes:requested', requested);
    clickHero(g.world, 'warrior');
    expect(requested).toHaveBeenCalledTimes(1);
    g.world.station.ready.push('slime_sap');
    clickReadyDrink(g.world, 0);
    clickHero(g.world, 'warrior');
    expect(g.world.station.ready).toEqual(['slime_sap']);
    expect(requested).toHaveBeenCalledTimes(1);
  });
});

describe('the hero lesson', () => {
  const before = TUTORIAL_STEPS.filter((s) => s.lesson !== 'hero').map((s) => s.id);

  it('starts when the warrior moves in, points the way to the Heroes tab and the send button, then at the guild hall', () => {
    const state = famous();
    state.tutorial = { completedSteps: [...before], skipped: false };
    const g = newGame(state, testClock());
    expect(g.shown()).toBeNull();
    buildRoomById(g.world, GUILD_ROOM_ID);
    expect(g.shown()).toBe('hero_send');
    expect(resolveTarget('guide-hero-send', g.guide())).toBe('panel-button');
    g.world.bus.emit('heroes:opened', {});
    expect(resolveTarget('guide-hero-send', g.guide())).toBe('hero-send:warrior');
    expect(speech('hero_send', g.guide())).toContain('send Brakka to the Swamp');
    sendHero(g.world, 'warrior');
    expect(g.shown()).toBe('hero_done');
    g.tick(7_000);
    expect(g.shown()).toBeNull();
  });

  it('does not let an early trip skip a lesson that is still waiting, and then only shows the closing line', () => {
    const state = famous(true);
    const decorAt = before.indexOf('decor_buy');
    state.tutorial = { completedSteps: before.slice(0, decorAt), skipped: false };
    state.currencies.gold = num(0);
    const g = newGame(state, testClock());
    sendHero(g.world, 'warrior');
    expect(g.state.tutorial.completedSteps).not.toContain('decor_buy');
    expect(g.state.tutorial.completedSteps).not.toContain('hero_send');
    // The player buys a decoration later; on the next load the hero lesson only has its closing line left.
    g.state.tutorial.completedSteps.push('decor_buy', 'decor_done');
    const fresh = newGame(g.state, testClock());
    expect(fresh.shown()).toBe('hero_done');
  });
});
