import type { World } from '@/app/world';
import { type GearDrop, gearPower, unfoundDrops } from '@/heroes/gear';
import { completeHeroes, gainXp, HEROES, HERO_CLASSES, heroStatus, injuryChance, newHero, recruitGuildHeroes } from '@/heroes/heroes';
import { GUILD_ROOM_ID } from '@/rooms/rooms';
import { pickWeighted, type Rng } from '@/shared/random';
import type { Expedition, GameState, HeroState } from '@/shared/state';

/** One roll of loot picks a drop by weight and gives `amount` of its ingredient. */
export interface LootDrop {
  ingredient: string;
  weight: number;
  amount: number;
}

/**
 * A dungeon: how long a trip takes, the XP it gives, its loot, and the chance to find a piece of gear (one the player does
 * not own yet, by weight). Texts: `dungeons.<id>.name` and `.description`.
 */
export interface DungeonDef {
  id: string;
  recommendedLevel: number;
  durationSeconds: number;
  xp: number;
  lootRolls: number;
  drops: readonly LootDrop[];
  gearChance: number;
  gearDrops: readonly GearDrop[];
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
    gearChance: 0.06,
    gearDrops: [
      { gear: 'swamp_cleaver', weight: 1 },
      { gear: 'frog_shield', weight: 1 },
      { gear: 'mudwalker_helm', weight: 1 },
      { gear: 'witch_eye', weight: 1 },
    ],
  },
];

/** How long a trip takes for this hero, in ms: a helmet makes it shorter. */
export const tripMs = (dungeon: DungeonDef, hero: Pick<HeroState, 'gear'>): number =>
  Math.round(dungeon.durationSeconds * 1000 * (1 - gearPower(hero, 'helmet')));

/**
 * The loot of one trip: ingredient id to amount. A sword (`sword`: its power) adds that share of rolls; the part of a
 * roll left over is the chance of one more (the generator is only asked when there is such a part).
 */
export function rollLoot(dungeon: DungeonDef, rng: Rng, sword = 0): Record<string, number> {
  const loot: Record<string, number> = {};
  const exact = dungeon.lootRolls * (1 + sword);
  let rolls = Math.floor(exact);
  if (exact > rolls && rng() < exact - rolls) rolls += 1;
  for (let i = 0; i < rolls; i++) {
    const drop = pickWeighted(rng, dungeon.drops, (d) => d.weight);
    if (drop !== undefined) loot[drop.ingredient] = (loot[drop.ingredient] ?? 0) + drop.amount;
  }
  return loot;
}

/** Send a hero at home and fit to a dungeon; the trip ends at an absolute time, so it also runs while the game is closed. */
export function sendHero({ store, bus, clock }: Pick<World, 'store' | 'bus' | 'clock'>, heroId: string, dungeonId = DUNGEONS[0]?.id ?? ''): void {
  const hero = store.getState().heroes[heroId];
  const dungeon = DUNGEONS.find((d) => d.id === dungeonId);
  if (hero === undefined || dungeon === undefined || heroStatus(hero, clock.now()) !== 'home') return;
  const endsAt = clock.now() + tripMs(dungeon, hero);
  store.update((s) => {
    const h = s.heroes[heroId];
    if (h !== undefined) h.expedition = { dungeon: dungeon.id, endsAt };
  });
  bus.emit('hero:departed', { id: heroId, dungeon: dungeon.id });
  bus.emit('saveRequested', {});
}

/** Maybe a piece of gear from the dungeon that the player does not own yet. */
function rollGear(state: Pick<GameState, 'gearOwned'>, dungeon: DungeonDef, rng: Rng): string | null {
  if (rng() >= dungeon.gearChance) return null;
  return pickWeighted(rng, unfoundDrops(state, dungeon.gearDrops), (d) => d.weight)?.gear ?? null;
}

/**
 * A trip is over: loot into the stock (more with a sword), XP (and levels), maybe a piece of gear, and maybe an injury
 * (less likely with a shield) that rests from the moment they were back.
 */
function returnHero({ store, bus, rng }: Pick<World, 'store' | 'bus' | 'rng'>, heroId: string, trip: Expedition): void {
  const dungeon = DUNGEONS.find((d) => d.id === trip.dungeon);
  const hero = store.getState().heroes[heroId] ?? newHero();
  const level = hero.level;
  const loot = dungeon === undefined ? {} : rollLoot(dungeon, rng, gearPower(hero, 'sword'));
  const injured = rng() < injuryChance(level, gearPower(hero, 'shield'));
  const gear = dungeon === undefined ? null : rollGear(store.getState(), dungeon, rng);
  const xp = dungeon?.xp ?? 0;
  let gained = 0;
  store.update((s) => {
    const h = s.heroes[heroId];
    if (h === undefined) return;
    h.expedition = null;
    h.injuredUntil = injured ? trip.endsAt + HEROES.restMs : 0;
    gained = gainXp(h, xp);
    for (const [id, n] of Object.entries(loot)) s.ingredientStock[id] = (s.ingredientStock[id] ?? 0) + n;
    if (gear !== null) s.gearOwned.push(gear);
  });
  const now = store.getState().heroes[heroId]?.level ?? level;
  bus.emit('hero:returned', { id: heroId, dungeon: trip.dungeon, loot, gear, xp, level: now, levelUp: gained > 0, injured });
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
  completeHeroes(world.store);
  recruitGuildHeroes(world);
  world.bus.on('room:built', ({ id }) => {
    if (id === GUILD_ROOM_ID) recruitGuildHeroes(world);
  });
  world.bus.on('tick', () => returnHeroes(world));
}
