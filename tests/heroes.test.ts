import { describe, expect, it } from 'vitest';
import { HERO_SPOTS, ROOM_SPOTS } from '@/app/layout';
import {
  DUNGEONS, GUILD_ROOM_ID, HERO_CLASSES, HEROES, gainXp, heroStatus, heroWaitMs, hireOffer, injuryChance, newHero, readyHeroId, rollLoot, xpToNext,
} from '@/heroes/heroes';
import { clockText, type HeroesState, toHeroesView } from '@/heroes/heroes-model';
import { hasKey } from '@/i18n/translator';
import { ROOMS } from '@/rooms/rooms';
import { num } from '@/shared/numbers';
import { createSeededRng } from '@/shared/random';
import type { HeroState } from '@/shared/state';

const hero = (over: Partial<HeroState> = {}): HeroState => ({ ...newHero(), ...over });
const classDef = (id: string) => {
  const def = HERO_CLASSES.find((c) => c.id === id);
  if (def === undefined) throw new Error(`no hero class ${id}`);
  return def;
};
const swamp = DUNGEONS[0] ?? (() => { throw new Error('no dungeon'); })();
const heroesState = (over: Partial<HeroesState> = {}): HeroesState => ({ heroes: {}, roomsBuilt: [], currencies: { gold: num(0) }, ingredientStock: {}, ...over });

describe('hero growth', () => {
  it('needs more XP for every next level', () => {
    expect(xpToNext(1)).toBe(HEROES.firstLevelXp);
    expect(xpToNext(2)).toBeGreaterThan(xpToNext(1));
  });

  it('levels up as often as the XP reaches, keeping the rest', () => {
    const h = hero();
    expect(gainXp(h, xpToNext(1) - 1)).toBe(0);
    expect(gainXp(h, 1 + xpToNext(2) + 5)).toBe(2);
    expect(h).toMatchObject({ level: 3, xp: 5 });
  });

  it('stops at the top level, where XP no longer counts', () => {
    const h = hero({ level: HEROES.maxLevel - 1 });
    gainXp(h, 1e9);
    expect(h).toMatchObject({ level: HEROES.maxLevel, xp: 0 });
  });

  it('gets injured less often at a higher level, never below the minimum', () => {
    expect(injuryChance(1)).toBe(HEROES.injuryChance);
    expect(injuryChance(5)).toBeLessThan(injuryChance(1));
    expect(injuryChance(HEROES.maxLevel * 10)).toBe(HEROES.minInjuryChance);
  });
});

describe('expeditions', () => {
  it('rolls the dungeon loot: one drop per roll, only ingredients the dungeon has', () => {
    const loot = rollLoot(swamp, createSeededRng(1));
    const total = Object.values(loot).reduce((sum, n) => sum + n, 0);
    expect(total).toBe(swamp.lootRolls);
    for (const id of Object.keys(loot)) expect(swamp.drops.map((d) => d.ingredient)).toContain(id);
  });

  it('knows whether a hero is home, away or resting, and how long it takes', () => {
    expect(heroStatus(hero(), 1000)).toBe('home');
    const away = hero({ expedition: { dungeon: 'swamp', endsAt: 5000 } });
    expect(heroStatus(away, 1000)).toBe('away');
    expect(heroWaitMs(away, 1000)).toBe(4000);
    expect(heroStatus(hero({ injuredUntil: 3000 }), 1000)).toBe('injured');
    expect(heroStatus(hero({ injuredUntil: 3000 }), 3000)).toBe('home');
    expect(heroWaitMs(hero(), 1000)).toBe(0);
  });

  it('picks the first hero who is home and fit', () => {
    const heroes = { warrior: hero({ injuredUntil: 9000 }), mage: hero() };
    expect(readyHeroId({ heroes }, 0)).toBe('mage');
    expect(readyHeroId({ heroes: {} }, 0)).toBeUndefined();
  });

  it('has a name for every ingredient a dungeon drops and a trip of one to three minutes', () => {
    for (const dungeon of DUNGEONS) {
      expect(dungeon.durationSeconds).toBeGreaterThanOrEqual(60);
      expect(dungeon.durationSeconds).toBeLessThanOrEqual(180);
      for (const drop of dungeon.drops) expect(hasKey(`ingredients.${drop.ingredient}.name`)).toBe(true);
    }
  });
});

describe('hiring heroes', () => {
  const mage = classDef('mage');
  const warrior = classDef('warrior');

  it('sells the mage only once the guild hall stands, and never the warrior', () => {
    expect(hireOffer(heroesState({ currencies: { gold: num(1e9) } }), mage).status).toBe('locked');
    const built = heroesState({ roomsBuilt: [GUILD_ROOM_ID], currencies: { gold: num(1e9) } });
    expect(hireOffer(built, mage)).toMatchObject({ status: 'forSale', affordable: true });
    expect(hireOffer({ ...built, currencies: { gold: num(1) } }, mage).affordable).toBe(false);
    expect(hireOffer(built, warrior).status).toBe('locked');
    expect(hireOffer({ ...built, heroes: { mage: hero() } }, mage).status).toBe('hired');
  });
});

describe('the Heroes tab', () => {
  it('formats a countdown as minutes and seconds, rounded up', () => {
    expect(clockText(65_000)).toBe('1:05');
    expect(clockText(1)).toBe('0:01');
    expect(clockText(-5)).toBe('0:00');
  });

  it('only says how to get heroes while there is no guild hall', () => {
    const view = toHeroesView(heroesState(), 0);
    expect(view.noGuild).toContain('Famous Tavern');
    expect(view.cards).toEqual([]);
    expect(view.stock).toEqual([]);
    const built = toHeroesView(heroesState({ roomsBuilt: [GUILD_ROOM_ID], heroes: { warrior: hero() } }), 0);
    expect(built.stock).toEqual(['Nothing yet. Send a hero!']);
  });

  it('shows each hero: send when home, a countdown when away, the hire price for the mage', () => {
    const state = heroesState({ roomsBuilt: [GUILD_ROOM_ID], heroes: { warrior: hero({ xp: 30 }) }, ingredientStock: { bog_pearl: 2, witch_moss: 0 } });
    const view = toHeroesView(state, 0);
    expect(view.noGuild).toBeNull();
    expect(view.stock).toEqual(['Bog Pearl ×2']);
    const [warrior, mage] = view.cards;
    expect(warrior).toMatchObject({ title: 'Brakka · Warrior', level: 'Level 1', xp: '30/100 XP', action: { kind: 'send', label: 'Send to the Swamp', enabled: true } });
    expect(warrior?.xpFraction).toBeCloseTo(0.3);
    expect(mage).toMatchObject({ level: '', action: { kind: 'hire', label: 'Hire · 8K', enabled: false } });
    state.heroes.warrior = hero({ expedition: { dungeon: 'swamp', endsAt: 90_000 } });
    expect(toHeroesView(state, 0).cards[0]).toMatchObject({ status: 'In the Swamp, back in 1:30.', action: { kind: 'none', enabled: false } });
    state.heroes.warrior = hero({ injuredUntil: 30_000 });
    expect(toHeroesView(state, 0).cards[0]?.status).toContain('resting for 0:30');
  });
});

describe('the guild hall on the upper floor', () => {
  it('is the fourth room, with a spot inside it for every hero', () => {
    expect(ROOMS.map((r) => r.id).indexOf(GUILD_ROOM_ID)).toBe(3);
    const rect = ROOM_SPOTS[GUILD_ROOM_ID]?.rect;
    for (const def of HERO_CLASSES) {
      const spot = HERO_SPOTS[def.id];
      expect(spot).toBeDefined();
      expect(spot?.x).toBeGreaterThan((rect?.x ?? 0) + 25);
      expect(spot?.x).toBeLessThan((rect?.x ?? 0) + (rect?.w ?? 0) - 25);
      expect(spot?.y).toBeLessThanOrEqual((rect?.y ?? 0) + (rect?.h ?? 0));
    }
  });
});
