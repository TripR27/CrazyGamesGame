import { describe, expect, it, vi } from 'vitest';
import { newGame } from './flows/helpers';
import { BOSS, BOSSES, bossBar, bossMods, bossResult, currentBoss, inZone, pointerAt, strikeBoss, strikeDamage, zoneWidth } from '@/heroes/boss-fight';
import { DUNGEONS } from '@/heroes/expedition';
import { newHero } from '@/heroes/heroes';
import { en } from '@/i18n/en';
import { recipes } from '@/recipes/recipe-data';
import { GUILD_ROOM_ID } from '@/rooms/rooms';
import { createInitialState, type Expedition, type GameState, type HeroState } from '@/shared/state';
import { TUTORIAL_STEPS } from '@/tutorial/tutorial-steps';

const hero = (over: Partial<HeroState> = {}): HeroState => ({ ...newHero(), ...over });
const trip = (over: Partial<Expedition> = {}): Expedition => ({ dungeon: 'swamp', endsAt: 1e6, drinks: [], cards: [], ...over });
const fought = (hits: boolean[]): Expedition => trip({ boss: { hits, lastAt: 0 } });

function testClock(start = 1_000_000) {
  let now = start;
  return { now: () => now, advance: (ms: number) => void (now += ms) };
}

/** The guild hall with the warrior on a trip that ends in 20 s (so the boss shows up in 5 s), every lesson done. */
function nearTheBoss(clock: { now(): number }, over: Partial<Expedition> = {}): GameState {
  const state = createInitialState(0);
  state.reputation = 300;
  state.tutorial.skipped = true;
  state.roomsBuilt = [GUILD_ROOM_ID];
  state.heroes = { warrior: hero({ expedition: trip({ endsAt: clock.now() + 20_000, ...over }) }) };
  return state;
}

describe('the timing bar', () => {
  it('swings the pointer from left to right and back', () => {
    expect(pointerAt(0, 1000)).toBe(0);
    expect(pointerAt(500, 1000)).toBeCloseTo(0.5);
    expect(pointerAt(1000, 1000)).toBeCloseTo(1);
    expect(pointerAt(1500, 1000)).toBeCloseTo(0.5);
    expect(pointerAt(2000, 1000)).toBeCloseTo(0);
  });

  it('has a green zone in the middle that strength drinks widen, up to a limit', () => {
    expect(zoneWidth(0)).toBeCloseTo(BOSS.zone);
    expect(zoneWidth(1)).toBeCloseTo(BOSS.zone + BOSS.zonePerStrength);
    expect(zoneWidth(100)).toBe(BOSS.maxZone);
    expect(inZone(0.5, 0.2)).toBe(true);
    expect(inZone(0.59, 0.2)).toBe(true);
    expect(inZone(0.65, 0.2)).toBe(false);
    const out = { pointer: 0, zone: 0 };
    const strong = bossBar(recipes, 'warrior', newHero(), trip({ drinks: ['gym_sock_mead'] }), 0, out);
    expect(strong.zone).toBeCloseTo(zoneWidth(1));
    // The mage gets more out of a drink, so the zone grows more.
    expect(bossBar(recipes, 'mage', newHero(), trip({ drinks: ['gym_sock_mead'] }), 0, out).zone).toBeCloseTo(zoneWidth(1.5));
  });
});

describe('the outcome of a fight', () => {
  it('hits harder with the warrior and with every level', () => {
    expect(strikeDamage('warrior', 1)).toBe(1.5);
    expect(strikeDamage('mage', 1)).toBe(1);
    expect(strikeDamage('mage', 6)).toBeCloseTo(1.5);
  });

  it('is won with enough good strikes; no strikes is the default outcome, and missing strikes are misses', () => {
    expect(bossResult('warrior', 1, fought([true, false, true]))).toBe('won');
    expect(bossResult('mage', 1, fought([true, false, true]))).toBe('lost');
    expect(bossResult('mage', 1, fought([true, true, true]))).toBe('won');
    expect(bossResult('mage', 6, fought([true, true, false]))).toBe('won');
    expect(bossResult('warrior', 1, fought([true]))).toBe('lost');
    expect(bossResult('warrior', 1, trip())).toBeNull();
    expect(bossMods('won', 'swamp')).toEqual(BOSSES.swamp?.loot);
    expect(bossMods('lost', 'swamp')).toEqual({});
    expect(bossMods(null, 'swamp')).toEqual({});
  });
});

describe('the boss fight in the game', () => {
  it('shows up near the end of the trip; timed strikes win, and the boss loot comes home', () => {
    const clock = testClock();
    const g = newGame(nearTheBoss(clock), clock);
    const opened = vi.fn();
    const resolved = vi.fn();
    const returned = vi.fn();
    g.world.bus.on('boss:opened', opened);
    g.world.bus.on('boss:resolved', resolved);
    g.world.bus.on('hero:returned', returned);
    g.tick(100);
    expect(currentBoss(g.world.store.getState(), clock.now())).toBeUndefined();
    clock.advance(20_000 - BOSS.windowMs);
    g.tick(200);
    expect(opened).toHaveBeenCalledTimes(1);
    expect(currentBoss(g.world.store.getState(), clock.now())?.heroId).toBe('warrior');
    // The pointer starts at the left: a miss. Then each swing is timed to the middle.
    strikeBoss(g.world, 'warrior');
    clock.advance((BOSS.swingMs[1] ?? 0) / 2);
    strikeBoss(g.world, 'warrior');
    clock.advance((BOSS.swingMs[2] ?? 0) / 2);
    strikeBoss(g.world, 'warrior');
    expect(g.world.store.getState().heroes.warrior?.expedition?.boss?.hits).toEqual([false, true, true]);
    expect(resolved).toHaveBeenCalledWith({ heroId: 'warrior', result: 'won' });
    expect(currentBoss(g.world.store.getState(), clock.now())).toBeUndefined();
    clock.advance(BOSS.windowMs);
    g.tick(100);
    expect(resolved).toHaveBeenCalledTimes(1);
    expect(returned).toHaveBeenCalledWith(expect.objectContaining({ boss: 'won' }));
    expect(g.world.store.getState().ingredientStock.witch_moss ?? 0).toBeGreaterThanOrEqual(2);
  });

  it('keeps the hero for a strike at the last moment, and ignores strikes when no boss is there', () => {
    const clock = testClock();
    const g = newGame(nearTheBoss(clock), clock);
    strikeBoss(g.world, 'warrior');
    expect(g.world.store.getState().heroes.warrior?.expedition?.boss).toBeUndefined();
    clock.advance(19_500);
    strikeBoss(g.world, 'warrior');
    expect(g.world.store.getState().heroes.warrior?.expedition?.endsAt).toBe(clock.now() + BOSS.graceMs);
  });

  it('gives the default outcome to a player who does not fight', () => {
    const clock = testClock();
    const g = newGame(nearTheBoss(clock), clock);
    const resolved = vi.fn();
    const returned = vi.fn();
    g.world.bus.on('boss:resolved', resolved);
    g.world.bus.on('hero:returned', returned);
    clock.advance(20_000);
    g.tick(100);
    expect(resolved).toHaveBeenCalledWith({ heroId: 'warrior', result: null });
    expect(returned).toHaveBeenCalledWith(expect.objectContaining({ boss: null }));
  });

  it('has a boss with a name in every dungeon', () => {
    for (const dungeon of DUNGEONS) {
      const boss = BOSSES[dungeon.id];
      expect(boss).toBeDefined();
      expect(en).toHaveProperty(`bosses.${boss?.id ?? ''}.name`);
    }
  });
});

describe('the boss lesson', () => {
  const done = TUTORIAL_STEPS.filter((s) => s.lesson !== 'boss').map((s) => s.id);

  it('points at the strike button while the boss is there, then closes', () => {
    const clock = testClock();
    const state = nearTheBoss(clock);
    state.tutorial = { completedSteps: [...done], skipped: false };
    const g = newGame(state, clock);
    g.tick(100);
    expect(g.shown()).toBeNull();
    clock.advance(20_000 - BOSS.windowMs);
    g.tick(100);
    expect(g.shown()).toBe('boss_fight');
    expect(TUTORIAL_STEPS.find((s) => s.id === 'boss_fight')?.target).toBe('boss-strike');
    expect(g.guide().bossHeroId).toBe('warrior');
    for (let i = 0; i < 3; i++) strikeBoss(g.world, 'warrior');
    expect(g.shown()).toBe('boss_done');
  });

  it('also closes when the hero comes back before the player fought', () => {
    const clock = testClock();
    const state = nearTheBoss(clock);
    state.tutorial = { completedSteps: [...done], skipped: false };
    const g = newGame(state, clock);
    clock.advance(20_000 - BOSS.windowMs);
    g.tick(100);
    expect(g.shown()).toBe('boss_fight');
    clock.advance(BOSS.windowMs);
    g.tick(100);
    expect(g.shown()).toBe('boss_done');
  });
});
