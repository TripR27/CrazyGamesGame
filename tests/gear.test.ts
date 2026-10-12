import { describe, expect, it, vi } from 'vitest';
import { newGame } from './flows/helpers';
import { createWorld } from '@/app/world';
import { GEAR, buyGearById, equipGear, gearOffer, gearToWear, wearer } from '@/heroes/gear';
import { DUNGEONS, rollLoot, sendHero, tripMs } from '@/heroes/expedition';
import { completeHeroes, injuryChance, newHero } from '@/heroes/heroes';
import { toHeroesView } from '@/heroes/heroes-model';
import { GUILD_ROOM_ID } from '@/rooms/rooms';
import { createEventBus, type GameEvents } from '@/shared/events';
import { num } from '@/shared/numbers';
import { createSeededRng } from '@/shared/random';
import { createInitialState, createStore, type GameState, type HeroState } from '@/shared/state';
import { resolveTarget } from '@/tutorial/tutorial-guide';
import { TUTORIAL_STEPS } from '@/tutorial/tutorial-steps';

const swamp = DUNGEONS[0] ?? (() => { throw new Error('no dungeon'); })();
const piece = (id: string) => GEAR.find((g) => g.id === id) ?? (() => { throw new Error(`no gear ${id}`); })();
const hero = (over: Partial<HeroState> = {}): HeroState => ({ ...newHero(), ...over });

/** A save with the guild hall, the warrior and the mage at home, and gold to spend. */
function guild(gold = 20_000): GameState {
  const state = createInitialState(0);
  state.reputation = 300;
  state.currencies.gold = num(gold);
  state.tutorial.skipped = true;
  state.roomsBuilt = [GUILD_ROOM_ID];
  state.heroes = { warrior: newHero(), mage: newHero() };
  return state;
}

describe('buying gear', () => {
  it('sells the simple pieces once the guild hall stands, once each; loot-only pieces are never sold', () => {
    const sword = piece('rusty_sword');
    expect(gearOffer({ ...guild(), roomsBuilt: [] }, sword).status).toBe('locked');
    expect(gearOffer(guild(), piece('swamp_cleaver')).status).toBe('locked');
    const g = newGame(guild(5000));
    const bought = vi.fn();
    g.world.bus.on('gear:bought', bought);
    buyGearById(g.world, 'rusty_sword');
    buyGearById(g.world, 'rusty_sword');
    expect(g.state.gearOwned).toEqual(['rusty_sword']);
    expect(g.state.currencies.gold.toNumber()).toBe(5000 - (sword.buy?.cost ?? 0));
    expect(bought).toHaveBeenCalledTimes(1);
    expect(gearOffer(g.state, sword).status).toBe('owned');
  });
});

describe('wearing gear', () => {
  it('puts an owned piece in its own slot of a hero at home, moves it between heroes at home, and takes it off', () => {
    const state = guild();
    state.gearOwned = ['rusty_sword'];
    const g = newGame(state);
    equipGear(g.world, 'warrior', 'shield', 'rusty_sword');
    equipGear(g.world, 'warrior', 'sword', 'leather_cap');
    expect(g.state.heroes.warrior?.gear).toEqual({});
    equipGear(g.world, 'warrior', 'sword', 'rusty_sword');
    expect(wearer(g.state, 'rusty_sword')).toBe('warrior');
    equipGear(g.world, 'mage', 'sword', 'rusty_sword');
    expect(g.state.heroes.warrior?.gear).toEqual({});
    expect(g.state.heroes.mage?.gear).toEqual({ sword: 'rusty_sword' });
    equipGear(g.world, 'mage', 'sword', null);
    expect(wearer(g.state, 'rusty_sword')).toBeUndefined();
  });

  it('never changes the gear of a hero on a trip, and never takes a piece off them', () => {
    const state = guild();
    state.gearOwned = ['rusty_sword', 'wooden_shield'];
    state.heroes.warrior = hero({ gear: { sword: 'rusty_sword' }, expedition: { dungeon: 'swamp', endsAt: 9e12, drinks: [], cards: [] } });
    const g = newGame(state);
    equipGear(g.world, 'warrior', 'shield', 'wooden_shield');
    equipGear(g.world, 'mage', 'sword', 'rusty_sword');
    expect(g.state.heroes.warrior?.gear).toEqual({ sword: 'rusty_sword' });
    expect(g.state.heroes.mage?.gear).toEqual({});
  });

  it('suggests a piece nobody wears for an empty or weaker slot, never a swap back', () => {
    const state = guild();
    state.gearOwned = ['rusty_sword', 'swamp_cleaver'];
    expect(gearToWear(state)).toEqual({ heroId: 'warrior', slot: 'sword', gearId: 'rusty_sword' });
    state.heroes.warrior = hero({ gear: { sword: 'swamp_cleaver' } });
    expect(gearToWear(state)).toEqual({ heroId: 'mage', slot: 'sword', gearId: 'rusty_sword' });
    state.heroes.mage = hero({ gear: { sword: 'rusty_sword' } });
    expect(gearToWear(state)).toBeNull();
  });

  it('fills in the gear and bag of a hero saved before they existed, and the drinks and cards of their trip', () => {
    const state = guild();
    state.heroes.warrior = { level: 3, xp: 5, injuredUntil: 0, expedition: null } as unknown as HeroState;
    state.heroes.mage = { ...newHero(), expedition: { dungeon: 'swamp', endsAt: 5 } } as unknown as HeroState;
    const store = createStore(state);
    completeHeroes(store);
    expect(store.getState().heroes.warrior).toEqual({ level: 3, xp: 5, injuredUntil: 0, expedition: null, gear: {}, bag: [], auto: false });
    expect(store.getState().heroes.mage?.expedition).toEqual({ dungeon: 'swamp', endsAt: 5, drinks: [], cards: [] });
  });
});

describe('what each slot does', () => {
  it('sword: more loot rolls', () => {
    const total = (sword: number): number => {
      let sum = 0;
      for (let seed = 1; seed <= 40; seed++) sum += Object.values(rollLoot(swamp, createSeededRng(seed), sword)).reduce((a, n) => a + n, 0);
      return sum;
    };
    expect(total(0)).toBe(40 * swamp.lootRolls);
    expect(total(0.6)).toBeGreaterThan(40 * swamp.lootRolls * 1.5);
  });

  it('shield: less chance of an injury; helmet: a shorter trip', () => {
    expect(injuryChance(1, 0.6)).toBeCloseTo(injuryChance(1) * 0.4);
    expect(tripMs(swamp, hero({ gear: { helmet: 'mudwalker_helm' } }))).toBe(Math.round(swamp.durationSeconds * 1000 * 0.7));
    const now = 1000;
    const g = newGame(guild(), { now: () => now });
    g.world.store.update((s) => {
      s.gearOwned.push('leather_cap');
      s.heroes.warrior = hero({ gear: { helmet: 'leather_cap' } });
    });
    sendHero(g.world, 'warrior');
    expect(g.state.heroes.warrior?.expedition?.endsAt).toBe(now + swamp.durationSeconds * 1000 * 0.85);
  });
});

describe('gear as loot', () => {
  it('can come back from the swamp: a piece the player does not own yet', () => {
    let now = 0;
    const state = guild();
    state.heroes.warrior = hero({ expedition: { dungeon: 'swamp', endsAt: 10, drinks: [], cards: [] } });
    const store = createStore(state);
    const bus = createEventBus<GameEvents>();
    const returned = vi.fn();
    bus.on('hero:returned', returned);
    // A generator that always says 0: every roll succeeds (loot, an injury, and a gear drop).
    createWorld({ store, bus, rng: () => 0, clock: { now: () => now } });
    now = 20;
    bus.emit('tick', { deltaMs: 100 });
    expect(store.getState().gearOwned).toEqual(['swamp_cleaver']);
    expect(returned).toHaveBeenCalledWith(expect.objectContaining({ gear: 'swamp_cleaver', injured: true }));
  });
});

describe('gear in the Heroes tab', () => {
  it('lists the pieces for sale and, per hero, what fits each slot', () => {
    const state = guild(5000);
    state.gearOwned = ['rusty_sword', 'swamp_cleaver'];
    state.heroes.warrior = hero({ gear: { sword: 'swamp_cleaver' }, expedition: { dungeon: 'swamp', endsAt: 9e12, drinks: [], cards: [] } });
    const view = toHeroesView(state, 0);
    expect(view.gearShop.map((g) => g.id)).toEqual(['wooden_shield', 'leather_cap', 'lucky_charm']);
    expect(view.gearShop[0]?.row).toMatchObject({ name: 'Wooden Shield', description: '🛡 Shield: 30% less chance of injury', canBuy: true });
    const [warrior, mage] = view.cards;
    expect(warrior?.slots[0]).toMatchObject({ slot: 'sword', selected: 'swamp_cleaver', enabled: false });
    // The cleaver is on a hero who is away, so the mage cannot take it.
    expect(mage?.slots[0]?.options.map((o) => o.id)).toEqual(['', 'rusty_sword']);
    expect(mage?.slots[0]?.options[1]?.label).toBe('Rusty Sword: +25% loot');
  });
});

describe('the gear lesson', () => {
  it('points the way to the Heroes tab, the buy button, then the slot of a hero at home', () => {
    const state = guild(5000);
    state.tutorial = { completedSteps: TUTORIAL_STEPS.filter((s) => s.lesson !== 'gear').map((s) => s.id), skipped: false };
    const g = newGame(state);
    expect(g.shown()).toBe('gear_buy');
    expect(resolveTarget('guide-gear-buy', g.guide())).toBe('panel-button');
    g.world.bus.emit('heroes:opened', {});
    expect(resolveTarget('guide-gear-buy', g.guide())).toBe('gear-buy:rusty_sword');
    buyGearById(g.world, 'rusty_sword');
    expect(g.shown()).toBe('gear_equip');
    expect(resolveTarget('guide-gear-equip', g.guide())).toBe('gear-slot:warrior:sword');
    equipGear(g.world, 'warrior', 'sword', 'rusty_sword');
    expect(g.shown()).toBeNull();
  });
});
