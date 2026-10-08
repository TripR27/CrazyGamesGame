import type { World } from '@/app/world';
import { num, type Num } from '@/shared/numbers';
import { GUILD_ROOM_ID } from '@/rooms/rooms';
import type { GameState, HeroState } from '@/shared/state';

/**
 * A hero class; there is one hero per class. `withGuildRoom`: the hero moves in when the guild hall is built,
 * otherwise they are hired in the Heroes tab once the guild hall stands. Texts: `heroes.<id>.name`, `.class`, `.tagline`.
 */
export interface HeroClassDef {
  id: string;
  hire: { cost: number } | 'withGuildRoom';
}

/** Placeholder prices, tuned with `npm run simulate`. A new class is data here, a spot in app/layout.ts and its texts. */
export const HERO_CLASSES: readonly HeroClassDef[] = [
  { id: 'warrior', hire: 'withGuildRoom' },
  { id: 'mage', hire: { cost: 8000 } },
];

/** Placeholder numbers for growth and injuries. */
export const HEROES = {
  maxLevel: 10,
  /** XP from level 1 to 2; every next level needs `xpGrowth` times more. */
  firstLevelXp: 100,
  xpGrowth: 1.5,
  /** Chance to come back injured at level 1; each level lowers it, never below the minimum. */
  injuryChance: 0.3,
  injuryPerLevel: 0.025,
  minInjuryChance: 0.05,
  /** How long an injured hero rests after coming back (a drink heals at once). */
  restMs: 90_000,
} as const;

export const newHero = (): HeroState => ({ level: 1, xp: 0, injuredUntil: 0, expedition: null, gear: {} });

/** XP needed to go from `level` to the next one. */
export const xpToNext = (level: number): number => Math.round(HEROES.firstLevelXp * HEROES.xpGrowth ** (level - 1));

/** Adds XP and levels up, as often as it reaches; at the top level XP no longer counts. Returns the levels gained. */
export function gainXp(hero: HeroState, xp: number): number {
  const before = hero.level;
  hero.xp += xp;
  while (hero.level < HEROES.maxLevel && hero.xp >= xpToNext(hero.level)) {
    hero.xp -= xpToNext(hero.level);
    hero.level += 1;
  }
  if (hero.level >= HEROES.maxLevel) hero.xp = 0;
  return hero.level - before;
}

/** The chance a hero of this level comes back injured; a shield (`shield`: its power) takes a share of it away. */
export const injuryChance = (level: number, shield = 0): number =>
  Math.max(HEROES.minInjuryChance, HEROES.injuryChance - HEROES.injuryPerLevel * (level - 1)) * (1 - shield);

/** Where a hero is: at home and fit, on a trip, or at home resting from an injury. */
export type HeroStatus = 'home' | 'away' | 'injured';

export function heroStatus(hero: HeroState, now: number): HeroStatus {
  if (hero.expedition !== null) return 'away';
  return hero.injuredUntil > now ? 'injured' : 'home';
}

/** Milliseconds until the hero is back (away) or fit again (injured); 0 at home. */
export function heroWaitMs(hero: HeroState, now: number): number {
  const until = hero.expedition?.endsAt ?? hero.injuredUntil;
  return Math.max(0, until - now);
}

export const guildBuilt = (state: Pick<GameState, 'roomsBuilt'>): boolean => state.roomsBuilt.includes(GUILD_ROOM_ID);

/** How hiring a hero stands: not possible yet (no guild hall, or a hero who comes with it), for sale, or hired. */
export interface HireOffer {
  status: 'locked' | 'forSale' | 'hired';
  cost: Num;
  affordable: boolean;
}

export function hireOffer(state: Pick<GameState, 'roomsBuilt' | 'heroes' | 'currencies'>, def: HeroClassDef): HireOffer {
  const cost = num(def.hire === 'withGuildRoom' ? 0 : def.hire.cost);
  if (state.heroes[def.id] !== undefined) return { status: 'hired', cost, affordable: false };
  if (def.hire === 'withGuildRoom' || !guildBuilt(state)) return { status: 'locked', cost, affordable: false };
  return { status: 'forSale', cost, affordable: state.currencies.gold.gte(cost) };
}

/** The first hero at home and fit, in class order, or undefined. */
export function readyHeroId(state: Pick<GameState, 'heroes'>, now: number): string | undefined {
  return HERO_CLASSES.find((def) => {
    const hero = state.heroes[def.id];
    return hero !== undefined && heroStatus(hero, now) === 'home';
  })?.id;
}

/** True once any hero has been on a trip (or is on one). */
export const anyHeroTravelled = (state: Pick<GameState, 'heroes'>): boolean =>
  Object.values(state.heroes).some((h) => h.expedition !== null || h.level > 1 || h.xp > 0);

/** Moves in the heroes that come with the guild hall, once it is built. */
export function recruitGuildHeroes({ store, bus }: Pick<World, 'store' | 'bus'>): void {
  for (const def of HERO_CLASSES) {
    const state = store.getState();
    if (def.hire !== 'withGuildRoom' || !guildBuilt(state) || state.heroes[def.id] !== undefined) continue;
    store.update((s) => void (s.heroes[def.id] = newHero()));
    bus.emit('hero:recruited', { id: def.id });
  }
}

/** Hire a hero in the Heroes tab; does nothing without the guild hall, when hired already or too expensive. */
export function hireHeroById({ store, bus }: Pick<World, 'store' | 'bus'>, id: string): void {
  const def = HERO_CLASSES.find((c) => c.id === id);
  const offer = def === undefined ? undefined : hireOffer(store.getState(), def);
  if (def === undefined || offer?.affordable !== true) return;
  store.update((s) => {
    s.currencies.gold = s.currencies.gold.sub(offer.cost);
    s.heroes[def.id] = newHero();
  });
  bus.emit('hero:recruited', { id: def.id });
  bus.emit('saveRequested', {});
}

/** Heroes saved before a field existed get its default (the save keeps the heroes map as it is). */
export function completeHeroes(store: World['store']): void {
  const state = store.getState();
  if (Object.values(state.heroes).every((h) => typeof h.gear === 'object' && h.gear !== null)) return;
  store.update((s) => {
    for (const id in s.heroes) s.heroes[id] = { ...newHero(), ...s.heroes[id] };
  });
}
