import { describe, expect, it, vi } from 'vitest';
import { newGame } from './flows/helpers';
import { buyQuartermaster, catchUpTrips, QUARTERMASTER, quartermasterOffer, setHeroAuto } from '@/heroes/auto';
import { DUNGEONS, sendHero, tripMs } from '@/heroes/expedition';
import { HEROES, newHero } from '@/heroes/heroes';
import { toHeroesView } from '@/heroes/heroes-model';
import { boldOption, decideCard, TRIP_CARDS } from '@/heroes/trip-cards';
import type { OfflineReport } from '@/offline/offline';
import { GUILD_ROOM_ID } from '@/rooms/rooms';
import { num } from '@/shared/numbers';
import { createInitialState, type GameState, type HeroState } from '@/shared/state';
import { resolveTarget } from '@/tutorial/tutorial-guide';
import { TUTORIAL_STEPS } from '@/tutorial/tutorial-steps';

const swamp = DUNGEONS[0] ?? (() => { throw new Error('no dungeon'); })();
const hero = (over: Partial<HeroState> = {}): HeroState => ({ ...newHero(), ...over });
const MINUTE = 60_000;
const HOUR = 60 * MINUTE;

function testClock(start = 10 * HOUR) {
  let now = start;
  return { now: () => now, advance: (ms: number) => void (now += ms) };
}

/** The guild hall with the warrior at home, the Quartermaster bought (unless `bought` is false) and every lesson done. */
function guild({ bought = true, auto = true } = {}): GameState {
  const state = createInitialState(0);
  state.reputation = 300;
  state.currencies.gold = num(50_000);
  state.tutorial.skipped = true;
  state.roomsBuilt = [GUILD_ROOM_ID];
  state.quartermaster = bought;
  state.heroes = { warrior: hero({ auto }) };
  return state;
}

describe('the Quartermaster', () => {
  it('is for sale once the guild hall stands, and bought once', () => {
    const none = { quartermaster: false, roomsBuilt: [], currencies: { gold: num(1e6) } };
    expect(quartermasterOffer(none).status).toBe('locked');
    const g = newGame(guild({ bought: false, auto: false }));
    expect(quartermasterOffer(g.world.store.getState())).toMatchObject({ status: 'forSale', affordable: true });
    const bought = vi.fn();
    g.world.bus.on('quartermaster:bought', bought);
    buyQuartermaster(g.world);
    buyQuartermaster(g.world);
    expect(bought).toHaveBeenCalledTimes(1);
    expect(g.world.store.getState().currencies.gold.toNumber()).toBe(50_000 - QUARTERMASTER.cost);
    expect(quartermasterOffer(g.world.store.getState()).status).toBe('owned');
  });

  it('gives every hero an Auto switch, which needs the Quartermaster', () => {
    const g = newGame(guild({ bought: false, auto: false }));
    setHeroAuto(g.world, 'warrior', true);
    expect(g.world.store.getState().heroes.warrior?.auto).toBe(false);
    expect(toHeroesView(g.world.store.getState(), 0).cards[0]?.auto).toBeNull();
    expect(toHeroesView(g.world.store.getState(), 0).quartermaster?.name).toBe('Quartermaster');
    buyQuartermaster(g.world);
    expect(toHeroesView(g.world.store.getState(), 0).quartermaster).toBeNull();
    expect(toHeroesView(g.world.store.getState(), 0).cards[0]?.auto).toEqual({ label: 'Auto: off', on: false });
    setHeroAuto(g.world, 'warrior', true);
    expect(toHeroesView(g.world.store.getState(), 0).cards[0]?.auto).toEqual({ label: '🔁 Auto: on', on: true });
  });
});

describe('Auto while the game is open', () => {
  it('sends a hero at home out again after a short wait, at once with a full bag', () => {
    const clock = testClock();
    const g = newGame(guild(), clock);
    g.tick(100);
    expect(g.world.store.getState().heroes.warrior?.expedition).toBeNull();
    clock.advance(QUARTERMASTER.homeMs);
    g.tick(100);
    expect(g.world.store.getState().heroes.warrior?.expedition?.endsAt).toBe(clock.now() + tripMs(swamp, newHero()));

    const full = guild();
    full.heroes.warrior = hero({ auto: true, bag: Array.from({ length: HEROES.bagSize }, () => 'slime_sap') });
    const h = newGame(full, clock);
    h.tick(200);
    expect(h.world.store.getState().heroes.warrior?.expedition?.drinks).toHaveLength(HEROES.bagSize);
  });

  it('lets a hero switched off finish the trip and then wait', () => {
    const clock = testClock();
    const g = newGame(guild(), clock);
    sendHero(g.world, 'warrior');
    setHeroAuto(g.world, 'warrior', false);
    clock.advance(tripMs(swamp, newHero()) + HEROES.restMs + QUARTERMASTER.homeMs);
    g.tick(500);
    clock.advance(QUARTERMASTER.homeMs);
    g.tick(500);
    expect(g.world.store.getState().heroes.warrior?.expedition).toBeNull();
  });

  it('keeps the choice the player made on a card', () => {
    const clock = testClock();
    const state = guild();
    state.heroes.warrior = hero({ auto: true, bag: ['slime_sap', 'slime_sap'] });
    const g = newGame(state, clock);
    sendHero(g.world, 'warrior');
    const trip = g.world.store.getState().heroes.warrior?.expedition;
    const card = trip?.cards[0];
    if (trip == null || card === undefined) throw new Error('no card');
    const bold = boldOption(trip, card);
    clock.advance(card.at - clock.now());
    g.tick(100);
    decideCard(g.world, 'warrior', bold?.id ?? '');
    clock.advance(TRIP_CARDS.timeoutMs + 1000);
    g.tick(100);
    expect(g.world.store.getState().heroes.warrior?.expedition?.cards[0]?.choice).toBe(bold?.id);
  });
});


describe('Auto while away', () => {
  it('chains trips one after the other with the default choices, and the last one is still under way', () => {
    const clock = testClock();
    const g = newGame(guild(), clock);
    const returned = vi.fn();
    g.world.bus.on('hero:returned', returned);
    clock.advance(30 * MINUTE);
    const away = catchUpTrips(g.world, 30 * MINUTE, 2 * HOUR);
    // A trip of 2 minutes, 10 s at home in between, sometimes a rest: well over 5 trips in half an hour.
    expect(away.trips).toBeGreaterThan(5);
    expect(Object.values(away.loot).reduce((a, b) => a + b, 0)).toBeGreaterThanOrEqual(away.trips * swamp.lootRolls);
    expect(g.world.store.getState().ingredientStock).toEqual(away.loot);
    const trip = g.world.store.getState().heroes.warrior?.expedition;
    const restingNow = (g.world.store.getState().heroes.warrior?.injuredUntil ?? 0) > clock.now();
    expect(trip !== null || restingNow).toBe(true);
    if (trip != null) expect(trip.endsAt).toBeGreaterThan(clock.now());
    // Nothing is announced: the welcome-back window sums it up.
    expect(returned).not.toHaveBeenCalled();
  });

  it('starts no trip after the offline limit, and leaves heroes not on Auto alone', () => {
    const clock = testClock();
    const g = newGame(guild(), clock);
    clock.advance(5 * HOUR);
    const capped = catchUpTrips(g.world, 5 * HOUR, 1 * HOUR);
    expect(capped.trips).toBeGreaterThan(10);
    expect(capped.trips).toBeLessThan(40);
    expect(g.world.store.getState().heroes.warrior?.expedition).toBeNull();

    const off = newGame(guild({ auto: false }), clock);
    expect(catchUpTrips(off.world, HOUR, 2 * HOUR)).toEqual({ trips: 0, loot: {} });
  });

  it('names the trips in the welcome-back report', () => {
    const clock = testClock();
    const g = newGame(guild(), clock);
    const reports: OfflineReport[] = [];
    g.world.offline.inbox.subscribe((r) => reports.push(r));
    clock.advance(20 * MINUTE);
    g.world.offline.handleAway(20 * MINUTE);
    expect(reports[0]?.trips).toBeGreaterThan(3);
    expect(reports[0]?.heroLoot).toEqual(g.world.store.getState().ingredientStock);
  });
});

describe('the Auto lesson', () => {
  it('points at the Quartermaster, then at a hero\'s Auto switch, then closes', () => {
    const state = guild({ bought: false, auto: false });
    state.tutorial = { completedSteps: TUTORIAL_STEPS.filter((s) => s.lesson !== 'auto').map((s) => s.id), skipped: false };
    const g = newGame(state);
    expect(g.shown()).toBe('auto_buy');
    expect(resolveTarget('guide-quartermaster-buy', { ...g.guide(), openTab: 'heroes' })).toBe('quartermaster-buy');
    buyQuartermaster(g.world);
    expect(g.shown()).toBe('auto_on');
    expect(resolveTarget('guide-hero-auto', { ...g.guide(), openTab: 'heroes' })).toBe('hero-auto:warrior');
    setHeroAuto(g.world, 'warrior', true);
    expect(g.shown()).toBe('auto_done');
    g.tick(7000);
    expect(g.shown()).toBeNull();
  });
});
