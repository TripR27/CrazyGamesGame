import { describe, expect, it } from 'vitest';
import { content } from '@/app/world';
import { allSightEntries, clearNew, gearSightEntries, isShown, legacySightEntries, SIGHT, shopSightEntries, sightStatuses, tabHasNew, teaserRow } from '@/economy/shop-sight';
import { GUILD_ROOM_ID } from '@/rooms/rooms';
import { PRESTIGE, sellTavern } from '@/prestige/prestige';
import { num } from '@/shared/numbers';
import { createInitialState, type GameState } from '@/shared/state';
import { newGame } from './flows/helpers';

const entries = shopSightEntries(content);
const entry = (key: string) => {
  const found = allSightEntries(content).find((e) => e.key === key);
  if (found === undefined) throw new Error(`no entry ${key}`);
  return found;
};
const shownKeys = (state: GameState): string[] => entries.filter((e) => isShown(e, state)).map((e) => e.key);
const teasers = (state: GameState): string[] => {
  const statuses = sightStatuses(entries, state);
  return entries.filter((_, i) => statuses[i] === 'teaser').map((e) => e.key);
};

/** A game whose tutorial is skipped, with `gold` and `reputation`. */
function game(gold = 0, reputation = 0) {
  const state = createInitialState(0);
  state.tutorial.skipped = true;
  state.currencies.gold = num(gold);
  state.reputation = reputation;
  return newGame(state);
}
const setGold = (g: ReturnType<typeof game>, gold: number) => g.store.update((s) => void (s.currencies.gold = num(gold)));

describe('the shop at the start', () => {
  it('lists only Swift Cauldron, with one grey teaser per group of what comes later', () => {
    const g = game();
    expect(shownKeys(g.state)).toEqual(['upgrade:swift_cauldron']);
    expect(teasers(g.state)).toEqual([
      'ingredient:fire_pepper', 'room:extension', 'decor:wall_torch', 'upgrade:better_prices', 'upgrade:brewer_assistant', 'upgrade:night_shift',
    ]);
    expect(g.state.shopNew).toEqual([]);
  });

  it('says what a teaser waits for: a level, another upgrade, or more gold', () => {
    const g = game();
    expect(teaserRow(entry('ingredient:fire_pepper'), g.state)).toMatchObject({ name: 'Fire Pepper', level: 'Unlocks at Local Haunt', teaser: true, buyLabel: '' });
    expect(teaserRow(entry('upgrade:night_shift'), g.state).level).toBe("Comes after Brewer's Assistant or Waitress");
    expect(teaserRow(entry('upgrade:better_prices'), g.state).level).toBe('Save up to see it');
    expect(teaserRow(entry('legacy:copper_kettle'), g.state).level).toBe('Earn Golden Hop to see it');
  });
});

describe('an offer coming in sight', () => {
  it('needs half its first price at once, then stays even when the gold drops, marked new', () => {
    const g = game();
    setGold(g, 30 * SIGHT.share - 1);
    expect(shownKeys(g.state)).not.toContain('upgrade:better_prices');
    setGold(g, 30 * SIGHT.share);
    expect(shownKeys(g.state)).toContain('upgrade:better_prices');
    setGold(g, 0);
    expect(shownKeys(g.state)).toContain('upgrade:better_prices');
    expect(g.state.shopNew).toEqual(['upgrade:better_prices']);
    expect(tabHasNew(entries, g.state, 'shop')).toBe(true);
  });

  it('also needs its level', () => {
    const g = game(10_000);
    expect(shownKeys(g.state)).not.toContain('ingredient:fire_pepper');
    g.store.update((s) => void (s.reputation = 10));
    expect(shownKeys(g.state)).toContain('ingredient:fire_pepper');
    expect(shownKeys(g.state)).toContain('decor:wall_torch');
    expect(shownKeys(g.state)).not.toContain('room:extension');
  });

  it('is marked silently for what is already in sight when the game loads (an old save does not light up)', () => {
    const g = game(1000, 50);
    expect(shownKeys(g.state)).toContain('room:extension');
    expect(g.state.shopNew).toEqual([]);
  });

  it('is no longer new once its tab was open', () => {
    const g = game();
    setGold(g, 100);
    expect(tabHasNew(entries, g.state, 'shop')).toBe(true);
    clearNew(g.world, allSightEntries(content), 'heroes');
    expect(tabHasNew(entries, g.state, 'shop')).toBe(true);
    clearNew(g.world, allSightEntries(content), 'shop');
    expect(g.state.shopNew).toEqual([]);
  });
});

describe('sold out', () => {
  it('leaves the shop: an upgrade at its top level, a bought one-time offer', () => {
    const g = game(1e9, 1000);
    expect(shownKeys(g.state)).toEqual(expect.arrayContaining(['upgrade:extra_seat', 'room:extension']));
    g.store.update((s) => {
      s.upgrades.extra_seat = 6;
      s.roomsBuilt.push('extension');
    });
    expect(shownKeys(g.state)).not.toContain('upgrade:extra_seat');
    expect(shownKeys(g.state)).not.toContain('room:extension');
    expect(teasers(g.state)).not.toContain('upgrade:extra_seat');
  });

  it('a Legacy bonus at its top level and a bought piece of gear leave their tab too', () => {
    const state = createInitialState(0);
    state.shopSeen = ['legacy:copper_kettle', 'gear:rusty_sword'];
    state.roomsBuilt = [GUILD_ROOM_ID];
    const legacy = legacySightEntries();
    const gear = gearSightEntries();
    expect(sightStatuses(legacy, state)[0]).toBe('shown');
    expect(sightStatuses(gear, state)[0]).toBe('shown');
    state.prestige.legacy.copper_kettle = 5;
    state.gearOwned = ['rusty_sword'];
    expect(sightStatuses(legacy, state)[0]).toBe('hidden');
    expect(sightStatuses(gear, state)[0]).toBe('hidden');
  });

  it('shows no gear teaser before the guild hall stands', () => {
    const state = createInitialState(0);
    expect(sightStatuses(gearSightEntries(), state).every((s) => s === 'hidden')).toBe(true);
    state.roomsBuilt = [GUILD_ROOM_ID];
    expect(sightStatuses(gearSightEntries(), state)[0]).toBe('teaser');
  });
});

describe('selling the tavern', () => {
  it('starts the shop over, but the Legacy bonuses stay in sight', () => {
    const g = game(0, 1000);
    g.store.update((s) => {
      s.prestige.runEarned = num(PRESTIGE.hopGold * PRESTIGE.minHops * PRESTIGE.minHops);
      s.prestige.hops = 2;
    });
    expect(g.state.shopSeen).toEqual(expect.arrayContaining(['legacy:copper_kettle', 'upgrade:swift_cauldron']));
    sellTavern(g.world);
    expect(g.state.shopSeen.every((key) => key.startsWith('legacy:') || key === 'upgrade:swift_cauldron')).toBe(true);
    expect(g.state.shopSeen).toContain('legacy:copper_kettle');
  });
});
