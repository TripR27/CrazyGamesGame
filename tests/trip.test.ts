import { describe, expect, it, vi } from 'vitest';
import { newGame } from './flows/helpers';
import { DUNGEONS, sendHero, tripMs } from '@/heroes/expedition';
import { aimHeroCauldron, clickShelf } from '@/heroes/hero-brewing';
import { HEROES, newHero } from '@/heroes/heroes';
import { toHeroesView } from '@/heroes/heroes-model';
import { cardMods, currentCard, decideCard, drinkMods, drinkPower, scheduleCards, TRIP_CARDS } from '@/heroes/trip-cards';
import { recipes } from '@/recipes/recipe-data';
import { GUILD_ROOM_ID } from '@/rooms/rooms';
import { num } from '@/shared/numbers';
import { createSeededRng } from '@/shared/random';
import { createInitialState, type Expedition, type GameState, type HeroState } from '@/shared/state';
import { resolveTarget } from '@/tutorial/tutorial-guide';
import { TUTORIAL_STEPS } from '@/tutorial/tutorial-steps';

const swamp = DUNGEONS[0] ?? (() => { throw new Error('no dungeon'); })();
const hero = (over: Partial<HeroState> = {}): HeroState => ({ ...newHero(), ...over });
const trip = (over: Partial<Expedition> = {}): Expedition => ({ dungeon: 'swamp', endsAt: 1e6, drinks: [], cards: [], ...over });

/** A wall clock the test moves by hand. */
function testClock(start = 1_000_000) {
  let now = start;
  return { now: () => now, advance: (ms: number) => void (now += ms) };
}

/** The guild hall with the warrior at home, Fire Pepper bought and every lesson done. */
function guild(): GameState {
  const state = createInitialState(0);
  state.reputation = 300;
  state.currencies.gold = num(1000);
  state.tutorial.skipped = true;
  state.ingredientsBought = ['fire_pepper'];
  state.roomsBuilt = [GUILD_ROOM_ID];
  state.heroes = { warrior: newHero() };
  return state;
}

describe('the hero cauldron', () => {
  it('takes the next ingredients while picked, brews, and puts the drink in the bag of a hero at home, never on the bar', () => {
    const g = newGame(guild());
    const drinks = vi.fn();
    g.world.bus.on('hero:drink', drinks);
    aimHeroCauldron(g.world);
    expect(g.world.guild.aimed).toBe(true);
    clickShelf(g.world, 'swamp_slime');
    clickShelf(g.world, 'wild_honey');
    expect(g.world.guild.station.brewing?.recipeId).toBe('slime_sap');
    expect(g.world.guild.aimed).toBe(false);
    expect(g.world.station.contents).toEqual([]);
    g.tick(20_000);
    expect(g.state.heroes.warrior?.bag).toEqual(['slime_sap']);
    expect(g.world.station.ready).toEqual([]);
    expect(drinks).toHaveBeenCalledWith({ id: 'warrior', recipeId: 'slime_sap' });
    // Back to normal: the next ingredient goes into the tavern cauldron.
    clickShelf(g.world, 'swamp_slime');
    expect(g.world.station.contents).toEqual(['swamp_slime']);
  });

  it('heals an injured hero at home first, and grumbles when nobody can take a drink', () => {
    const clock = testClock();
    const state = guild();
    state.heroes.warrior = hero({ bag: ['slime_sap', 'slime_sap'] });
    const g = newGame(state, clock);
    const notice = vi.fn();
    g.world.bus.on('brew:notice', notice);
    aimHeroCauldron(g.world);
    expect(g.world.guild.aimed).toBe(false);
    expect(notice).toHaveBeenCalledWith(expect.objectContaining({ notice: 'nohero' }));
    g.world.store.update((s) => {
      const w = s.heroes.warrior;
      if (w !== undefined) w.injuredUntil = clock.now() + HEROES.restMs;
    });
    aimHeroCauldron(g.world);
    clickShelf(g.world, 'swamp_slime');
    clickShelf(g.world, 'wild_honey');
    g.tick(20_000);
    expect(g.state.heroes.warrior).toMatchObject({ injuredUntil: 0, bag: ['slime_sap', 'slime_sap'] });
  });
});

describe('drinks taken along', () => {
  it('leave the bag when the hero leaves; a speed drink makes the trip shorter', () => {
    const clock = testClock();
    const state = guild();
    state.recipesDiscovered.push('swamp_fire');
    state.heroes.warrior = hero({ bag: ['swamp_fire'] });
    const g = newGame(state, clock);
    sendHero(g.world, 'warrior');
    const expedition = g.state.heroes.warrior?.expedition;
    expect(g.state.heroes.warrior?.bag).toEqual([]);
    expect(expedition?.drinks).toEqual(['swamp_fire']);
    expect(expedition?.endsAt).toBe(clock.now() + Math.round(tripMs(swamp, hero()) * 0.85));
  });

  it('work by effect, more for the mage and with an amulet', () => {
    expect(drinkPower('warrior', hero())).toBe(1);
    expect(drinkPower('mage', hero())).toBe(1.5);
    expect(drinkPower('mage', hero({ gear: { amulet: 'witch_eye' } }))).toBeCloseTo(2.4);
    const luck = drinkMods(recipes, ['bog_lantern', 'bog_lantern'], 1);
    expect(luck.loot).toBeCloseTo(0.3);
    expect(drinkMods(recipes, ['gym_sock_mead'], 2).injury).toBeCloseTo(-0.1);
    expect(drinkMods(recipes, ['slime_sap'], 1)).toMatchObject({ duration: 1, loot: 0, injury: 0 });
  });
});

describe('choice cards', () => {
  it('are planned two per trip, spread over it, all different', () => {
    const cards = scheduleCards(0, 90_000, createSeededRng(3));
    expect(cards.map((c) => c.at)).toEqual([30_000, 60_000]);
    expect(new Set(cards.map((c) => c.id)).size).toBe(2);
    expect(cards.every((c) => c.choice === null)).toBe(true);
  });

  it('open when their time comes; a bold choice counts, and the mud shortens the rest of the trip', () => {
    const clock = testClock();
    const g = newGame(guild(), clock);
    const opened = vi.fn();
    g.world.bus.on('card:opened', opened);
    sendHero(g.world, 'warrior');
    g.world.store.update((s) => {
      const t = s.heroes.warrior?.expedition;
      if (t !== null && t !== undefined) t.cards = [{ id: 'path', at: clock.now() + 1000, choice: null }];
    });
    g.tick(100);
    expect(opened).not.toHaveBeenCalled();
    clock.advance(1000);
    g.tick(100);
    expect(opened).toHaveBeenCalledWith({ heroId: 'warrior', cardId: 'path' });
    const before = g.state.heroes.warrior?.expedition?.endsAt ?? 0;
    decideCard(g.world, 'warrior', 'mud');
    expect(g.state.heroes.warrior?.expedition?.cards[0]?.choice).toBe('mud');
    expect(g.state.heroes.warrior?.expedition?.endsAt).toBe(clock.now() + Math.round((before - clock.now()) * 0.75));
    expect(currentCard(g.state, clock.now())).toBeUndefined();
  });

  it('take the safe default when nobody chooses in time, and while the player was away', () => {
    const clock = testClock();
    const g = newGame(guild(), clock);
    const resolved = vi.fn();
    g.world.bus.on('card:resolved', resolved);
    sendHero(g.world, 'warrior');
    const cards = g.state.heroes.warrior?.expedition?.cards ?? [];
    clock.advance((cards[0]?.at ?? 0) - clock.now() + TRIP_CARDS.timeoutMs);
    g.tick(100);
    expect(resolved).toHaveBeenCalledWith(expect.objectContaining({ heroId: 'warrior', picked: false }));
    clock.advance(10 * 60_000);
    g.tick(100);
    expect(resolved).toHaveBeenCalledTimes(2);
    expect(g.state.heroes.warrior?.expedition).toBeNull();
  });

  it('change the end of the trip: a fight brings loot and risk, strength helps; the witch takes a drink, charm pays', () => {
    const fight = trip({ cards: [{ id: 'frog', at: 0, choice: 'fight' }] });
    expect(cardMods(recipes, fight, 1)).toMatchObject({ loot: 0.3, injury: 0.15 });
    const strong = cardMods(recipes, { ...fight, drinks: ['gym_sock_mead'] }, 1);
    expect(strong.loot).toBeCloseTo(0.45);
    expect(strong.injury).toBeCloseTo(0.05);
    const charmed = trip({ cards: [{ id: 'witch', at: 0, choice: 'give', drink: 'slime_sap' }] });
    expect(cardMods(recipes, charmed, 1).extra).toEqual({ witch_moss: 2 });
    expect(cardMods(recipes, { ...charmed, cards: [{ id: 'witch', at: 0, choice: 'walk' }] }, 1).extra).toEqual({});
  });

  it('hand over a drink on the witch card, a charm drink first', () => {
    const clock = testClock();
    const state = guild();
    state.heroes.warrior = hero({ expedition: trip({ endsAt: clock.now() + 60_000, drinks: ['bog_lantern', 'slime_sap'], cards: [{ id: 'witch', at: clock.now(), choice: null }] }) });
    const g = newGame(state, clock);
    decideCard(g.world, 'warrior', 'give');
    expect(g.state.heroes.warrior?.expedition).toMatchObject({ drinks: ['bog_lantern'], cards: [{ choice: 'give', drink: 'slime_sap' }] });
  });
});

describe('the Heroes tab', () => {
  it('shows what is in the bag, and what went along on a trip', () => {
    const state = guild();
    state.heroes.warrior = hero({ bag: ['slime_sap'] });
    expect(toHeroesView(state, 0).cards[0]?.bag).toBe('🎒 Slime Sap');
    state.heroes.warrior = hero({ expedition: trip({ drinks: ['glowcap_stout'] }) });
    expect(toHeroesView(state, 0).cards[0]?.bag).toBe('🎒 Took along: Glowcap Stout');
    expect(toHeroesView(state, 0).drinksHelp).toContain('more loot');
  });
});

describe('the hero drink and card lessons', () => {
  const done = (lessons: string[]) => TUTORIAL_STEPS.filter((s) => !lessons.includes(s.lesson)).map((s) => s.id);

  it('point at the hero cauldron, then at an ingredient, until the drink is in a bag', () => {
    const state = guild();
    state.tutorial = { completedSteps: done(['hero_brew', 'card']), skipped: false };
    const g = newGame(state);
    expect(g.shown()).toBe('hero_brew_aim');
    aimHeroCauldron(g.world);
    expect(g.shown()).toBe('hero_brew_fill');
    expect(resolveTarget('guide-hero-drink', g.guide())).toMatch(/^ingredient:/);
    clickShelf(g.world, 'swamp_slime');
    clickShelf(g.world, 'wild_honey');
    g.tick(20_000);
    expect(g.shown()).toBeNull();
  });

  it('point at the bold option of an open card', () => {
    const clock = testClock();
    const state = guild();
    state.tutorial = { completedSteps: done(['card']), skipped: false };
    state.heroes.warrior = hero({ expedition: trip({ endsAt: clock.now() + 60_000, cards: [{ id: 'frog', at: clock.now() + 500, choice: null }] }) });
    const g = newGame(state, clock);
    clock.advance(600);
    g.tick(100);
    expect(g.shown()).toBe('card_pick');
    expect(resolveTarget('guide-card', g.guide())).toBe('card-option:fight');
    decideCard(g.world, 'warrior', 'fight');
    expect(g.shown()).toBe('card_done');
  });
});
