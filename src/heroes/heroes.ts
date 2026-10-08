import type { World } from '@/app/world';
import { num, type Num } from '@/shared/numbers';
import { pickWeighted, type Rng } from '@/shared/random';
import type { Expedition, GameState, HeroState } from '@/shared/state';

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

/** The room on the upper floor where the heroes live (rooms/rooms.ts). */
export const GUILD_ROOM_ID = 'guild_hall';

/** One roll of loot picks a drop by weight and gives `amount` of its ingredient. */
export interface LootDrop {
  ingredient: string;
  weight: number;
  amount: number;
}

/** A dungeon: how long a trip takes, the XP it gives and its loot. Texts: `dungeons.<id>.name` and `.description`. */
export interface DungeonDef {
  id: string;
  recommendedLevel: number;
  durationSeconds: number;
  xp: number;
  lootRolls: number;
  drops: readonly LootDrop[];
}

/** Placeholder numbers. The swamp is the first dungeon; deeper ones are data here. */
export const DUNGEONS: readonly DungeonDef[] = [
  {
    id: 'swamp',
    recommendedLevel: 1,
    durationSeconds: 120,
    xp: 40,
    lootRolls: 3,
    drops: [
      { ingredient: 'bog_pearl', weight: 3, amount: 1 },
      { ingredient: 'witch_moss', weight: 2, amount: 1 },
    ],
  },
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

export const newHero = (): HeroState => ({ level: 1, xp: 0, injuredUntil: 0, expedition: null });

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

/** The chance a hero of this level comes back injured. */
export const injuryChance = (level: number): number =>
  Math.max(HEROES.minInjuryChance, HEROES.injuryChance - HEROES.injuryPerLevel * (level - 1));

/** The loot of one trip: ingredient id to amount. */
export function rollLoot(dungeon: DungeonDef, rng: Rng): Record<string, number> {
  const loot: Record<string, number> = {};
  for (let i = 0; i < dungeon.lootRolls; i++) {
    const drop = pickWeighted(rng, dungeon.drops, (d) => d.weight);
    if (drop !== undefined) loot[drop.ingredient] = (loot[drop.ingredient] ?? 0) + drop.amount;
  }
  return loot;
}

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

/** Send a hero at home and fit to a dungeon; the trip ends at an absolute time, so it also runs while the game is closed. */
export function sendHero({ store, bus, clock }: Pick<World, 'store' | 'bus' | 'clock'>, heroId: string, dungeonId = DUNGEONS[0]?.id ?? ''): void {
  const hero = store.getState().heroes[heroId];
  const dungeon = DUNGEONS.find((d) => d.id === dungeonId);
  if (hero === undefined || dungeon === undefined || heroStatus(hero, clock.now()) !== 'home') return;
  const endsAt = clock.now() + dungeon.durationSeconds * 1000;
  store.update((s) => {
    const h = s.heroes[heroId];
    if (h !== undefined) h.expedition = { dungeon: dungeon.id, endsAt };
  });
  bus.emit('hero:departed', { id: heroId, dungeon: dungeon.id });
  bus.emit('saveRequested', {});
}

/**
 * Click a hero in the guild hall. With a drink picked up from the bar, an injured hero drinks it and is fit at once;
 * with nothing picked up, the side panel opens on the Heroes tab.
 */
export function clickHero(world: Pick<World, 'store' | 'bus' | 'clock' | 'station' | 'selection'>, heroId: string): void {
  const { store, bus, clock, station, selection } = world;
  const hero = store.getState().heroes[heroId];
  if (hero === undefined) return;
  const picked = selection.selected();
  if (picked === null) {
    bus.emit('heroes:requested', {});
    return;
  }
  if (heroStatus(hero, clock.now()) !== 'injured') return;
  station.ready.splice(station.ready.indexOf(picked), 1);
  selection.clear();
  store.update((s) => {
    const h = s.heroes[heroId];
    if (h !== undefined) h.injuredUntil = 0;
  });
  bus.emit('hero:healed', { id: heroId, recipeId: picked });
  bus.emit('saveRequested', {});
}

/** A trip is over: loot into the stock, XP (and levels), and maybe an injury that rests from the moment they were back. */
function returnHero({ store, bus, rng }: Pick<World, 'store' | 'bus' | 'rng'>, heroId: string, trip: Expedition): void {
  const dungeon = DUNGEONS.find((d) => d.id === trip.dungeon);
  const level = store.getState().heroes[heroId]?.level ?? 1;
  const loot = dungeon === undefined ? {} : rollLoot(dungeon, rng);
  const injured = rng() < injuryChance(level);
  const xp = dungeon?.xp ?? 0;
  let gained = 0;
  store.update((s) => {
    const h = s.heroes[heroId];
    if (h === undefined) return;
    h.expedition = null;
    h.injuredUntil = injured ? trip.endsAt + HEROES.restMs : 0;
    gained = gainXp(h, xp);
    for (const [id, n] of Object.entries(loot)) s.ingredientStock[id] = (s.ingredientStock[id] ?? 0) + n;
  });
  const now = store.getState().heroes[heroId]?.level ?? level;
  bus.emit('hero:returned', { id: heroId, dungeon: trip.dungeon, loot, xp, level: now, levelUp: gained > 0, injured });
  bus.emit('saveRequested', {});
}

/** Brings back every hero whose trip has ended (also after a reload or a long absence: the end time is absolute). */
export function returnHeroes(world: Pick<World, 'store' | 'bus' | 'rng' | 'clock'>): void {
  const now = world.clock.now();
  for (const def of HERO_CLASSES) {
    const trip = world.store.getState().heroes[def.id]?.expedition;
    if (trip != null && now >= trip.endsAt) returnHero(world, def.id, trip);
  }
}

/** Runs the heroes: the warrior moves in with the guild hall, and trips end on the tick once their time has come. */
export function startHeroes(world: Pick<World, 'store' | 'bus' | 'rng' | 'clock'>): void {
  recruitGuildHeroes(world);
  world.bus.on('room:built', ({ id }) => {
    if (id === GUILD_ROOM_ID) recruitGuildHeroes(world);
  });
  world.bus.on('tick', () => returnHeroes(world));
}
