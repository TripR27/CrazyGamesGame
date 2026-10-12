import type { World } from '@/app/world';
import { bossMods, bossResult, runBoss, STRIKES } from '@/heroes/boss-fight';
import { type GearDrop, gearPower, unfoundDrops } from '@/heroes/gear';
import { completeHeroes, gainXp, HEROES, HERO_CLASSES, heroStatus, injuryChance, newHero, recruitGuildHeroes } from '@/heroes/heroes';
import { addMods, cardMods, decideCard, defaultOption, drinkMods, drinkPower, scheduleCards, TRIP_CARDS } from '@/heroes/trip-cards';
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

type TripWorld = Pick<World, 'store' | 'bus' | 'rng' | 'clock' | 'content'>;

/**
 * A hero at home and fit at `start` sets out for a dungeon then (without announcing it). The drinks in their bag go
 * along (a speed drink makes the trip shorter at once) and two choice cards are planned on the way. Returns false when
 * the hero cannot go.
 */
export function startTrip({ store, rng, content }: Pick<World, 'store' | 'rng' | 'content'>, heroId: string, dungeonId: string, start: number): boolean {
  const hero = store.getState().heroes[heroId];
  const dungeon = DUNGEONS.find((d) => d.id === dungeonId);
  if (hero === undefined || dungeon === undefined || heroStatus(hero, start) !== 'home') return false;
  const drinks = [...hero.bag];
  const ms = Math.round(tripMs(dungeon, hero) * drinkMods(content.recipes, drinks, drinkPower(heroId, hero)).duration);
  const cards = scheduleCards(start, ms, rng);
  store.update((s) => {
    const h = s.heroes[heroId];
    if (h === undefined) return;
    h.bag = [];
    h.expedition = { dungeon: dungeon.id, endsAt: start + ms, drinks, cards };
  });
  return true;
}

/** Send a hero at home and fit to a dungeon now. The trip ends at an absolute time, so it also runs while the game is closed. */
export function sendHero(world: TripWorld, heroId: string, dungeonId = DUNGEONS[0]?.id ?? ''): void {
  if (!startTrip(world, heroId, dungeonId, world.clock.now())) return;
  world.bus.emit('hero:departed', { id: heroId, dungeon: dungeonId });
  world.bus.emit('saveRequested', {});
}

/** Maybe a piece of gear from the dungeon that the player does not own yet; `bonus` adds to the chance. */
function rollGear(state: Pick<GameState, 'gearOwned'>, dungeon: DungeonDef, rng: Rng, bonus = 0): string | null {
  if (rng() >= dungeon.gearChance + bonus) return null;
  return pickWeighted(rng, unfoundDrops(state, dungeon.gearDrops), (d) => d.weight)?.gear ?? null;
}

/**
 * A trip is over: loot into the stock (more with a sword, luck drinks, bold choices and a won boss fight), XP (and
 * levels), maybe a piece of gear, and maybe an injury (less likely with a shield or strength, more after risky choices)
 * that rests from the moment they were back. Returns the loot; `announce` false keeps it quiet (time away).
 */
export function returnHero(
  { store, bus, rng, content }: Pick<World, 'store' | 'bus' | 'rng' | 'content'>,
  heroId: string,
  trip: Expedition,
  announce = true,
): Record<string, number> {
  const dungeon = DUNGEONS.find((d) => d.id === trip.dungeon);
  const hero = store.getState().heroes[heroId] ?? newHero();
  const level = hero.level;
  const power = drinkPower(heroId, hero);
  const boss = bossResult(heroId, level, trip);
  const mods = addMods(addMods(drinkMods(content.recipes, trip.drinks, power), cardMods(content.recipes, trip, power)), bossMods(boss, trip.dungeon));
  const loot = dungeon === undefined ? {} : rollLoot(dungeon, rng, gearPower(hero, 'sword') + mods.loot);
  for (const [id, n] of Object.entries(mods.extra)) loot[id] = (loot[id] ?? 0) + n;
  const injured = rng() < Math.min(1, Math.max(0, injuryChance(level, gearPower(hero, 'shield')) + mods.injury));
  const gear = dungeon === undefined ? null : rollGear(store.getState(), dungeon, rng, mods.gearChance);
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
  // While catching up on time away nothing is announced: the welcome-back window sums the trips up.
  if (!announce) return loot;
  const now = store.getState().heroes[heroId]?.level ?? level;
  // A fight that was cut short (or never fought) ends here; a finished one was announced at its last strike.
  if ((trip.boss?.hits.length ?? 0) < STRIKES) bus.emit('boss:resolved', { heroId, result: boss });
  bus.emit('hero:returned', { id: heroId, dungeon: trip.dungeon, loot, gear, xp, level: now, levelUp: gained > 0, injured, boss });
  bus.emit('saveRequested', {});
  return loot;
}

/**
 * The cards of every trip: a card announces itself when its time comes, and the safe default is taken once the player
 * let it wait too long (or the trip is over: while away the default always counts). `announced` remembers what was shown.
 */
function runCards(world: TripWorld, announced: Set<object>): void {
  const now = world.clock.now();
  for (const def of HERO_CLASSES) {
    const trip = world.store.getState().heroes[def.id]?.expedition;
    if (trip == null) continue;
    for (const card of trip.cards) {
      if (card.choice !== null || card.at > now) continue;
      if (now >= card.at + TRIP_CARDS.timeoutMs || now >= trip.endsAt) {
        decideCard(world, def.id, defaultOption(card.id), false);
      } else if (!announced.has(card)) {
        announced.add(card);
        world.bus.emit('card:opened', { heroId: def.id, cardId: card.id });
      }
    }
  }
}

/** Brings back every hero whose trip has ended (also after a reload or a long absence: the end time is absolute). */
export function returnHeroes(world: TripWorld): void {
  const now = world.clock.now();
  for (const def of HERO_CLASSES) {
    const trip = world.store.getState().heroes[def.id]?.expedition;
    if (trip != null && now >= trip.endsAt) returnHero(world, def.id, trip);
  }
}

/**
 * Runs the heroes: the warrior moves in with the guild hall, cards open and close, the boss shows up near the end, and
 * trips end once their time has come.
 */
export function startHeroes(world: TripWorld): void {
  completeHeroes(world.store);
  recruitGuildHeroes(world);
  world.bus.on('room:built', ({ id }) => {
    if (id === GUILD_ROOM_ID) recruitGuildHeroes(world);
  });
  const announced = new Set<object>();
  world.bus.on('tick', () => {
    runCards(world, announced);
    runBoss(world, announced);
    returnHeroes(world);
  });
}
