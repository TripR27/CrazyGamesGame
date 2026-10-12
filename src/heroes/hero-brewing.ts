import type { World } from '@/app/world';
import { advanceBrewing, type BrewStation, clickIngredient, createStation, publishBrewEvent } from '@/brewing/brewing';
import { guildBuilt, HERO_CLASSES, HEROES, heroStatus } from '@/heroes/heroes';
import { feedbackKey } from '@/shared/random';
import type { GameState } from '@/shared/state';

/**
 * The second cauldron, in the guild hall: drinks for the heroes. Runtime only, like the tavern cauldron. While `aimed`,
 * ingredients from the shelf go into it instead of into the tavern cauldron; once it brews, the shelf goes back to the
 * tavern. A finished drink never stands on the bar: it goes into the bag of a hero at home. The brewer never touches it.
 */
export interface GuildCauldron {
  station: BrewStation;
  aimed: boolean;
}

/** One finished drink waits at most (when no hero can take it yet); the drinks themselves go straight into a bag. */
export const createGuildCauldron = (): GuildCauldron => ({ station: createStation(1), aimed: false });

type HeroWorld = Pick<World, 'store' | 'bus' | 'clock'>;

/** The hero at home a new drink goes to: an injured one first (it heals them), then one with room in the bag. */
export function drinkTaker(state: Pick<GameState, 'heroes'>, now: number): { id: string; heals: boolean } | undefined {
  const atHome = HERO_CLASSES.map((c) => ({ id: c.id, hero: state.heroes[c.id] })).filter(({ hero }) => hero !== undefined && heroStatus(hero, now) !== 'away');
  const injured = atHome.find(({ hero }) => hero !== undefined && heroStatus(hero, now) === 'injured');
  if (injured !== undefined) return { id: injured.id, heals: true };
  const room = atHome.find(({ hero }) => (hero?.bag.length ?? HEROES.bagSize) < HEROES.bagSize);
  return room === undefined ? undefined : { id: room.id, heals: false };
}

/** Gives a drink to a hero: an injured hero drinks it and is fit at once, otherwise it goes into the bag. */
function giveDrink({ store, bus }: HeroWorld, heroId: string, recipeId: string, heals: boolean): void {
  store.update((s) => {
    const h = s.heroes[heroId];
    if (h === undefined) return;
    if (heals) h.injuredUntil = 0;
    else h.bag.push(recipeId);
  });
  if (heals) bus.emit('hero:healed', { id: heroId, recipeId });
  else bus.emit('hero:drink', { id: heroId, recipeId });
  bus.emit('saveRequested', {});
}

/**
 * Click a hero in the guild hall. With a drink picked up from the bar, an injured hero drinks it and is fit at once, and
 * a fit hero at home puts it in the bag (while there is room); with nothing picked up, the side panel opens on the Heroes tab.
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
  const status = heroStatus(hero, clock.now());
  if (status === 'away' || (status === 'home' && hero.bag.length >= HEROES.bagSize)) return;
  station.ready.splice(station.ready.indexOf(picked), 1);
  selection.clear();
  giveDrink(world, heroId, picked, status === 'injured');
}

type GuildWorld = Pick<World, 'store' | 'bus' | 'clock' | 'rng' | 'guild'>;

/** Click the hero cauldron: the next ingredients go into it (or, clicked again, back to the tavern cauldron). */
export function aimHeroCauldron({ store, bus, clock, rng, guild }: GuildWorld): void {
  if (!guildBuilt(store.getState())) return;
  const notice = (kind: 'busy' | 'nohero'): void => publishBrewEvent(bus, { kind: 'notice', notice: kind, messageKey: feedbackKey(kind, rng) });
  if (!guild.aimed && guild.station.brewing !== null) return notice('busy');
  if (!guild.aimed && drinkTaker(store.getState(), clock.now()) === undefined) return notice('nohero');
  guild.aimed = !guild.aimed;
  bus.emit('guild:aimed', { aimed: guild.aimed });
}

/** A click on a shelf ingredient: into the hero cauldron while it is aimed (until it brews), otherwise into the tavern cauldron. */
export function clickShelf(world: Pick<World, 'bus' | 'station' | 'rng' | 'store' | 'content' | 'guild'>, ingredientId: string): void {
  const { guild } = world;
  if (!guild.aimed) return clickIngredient(world, ingredientId);
  clickIngredient(world, ingredientId, guild.station);
  if (guild.station.brewing === null) return;
  guild.aimed = false;
  world.bus.emit('guild:aimed', { aimed: false });
}

/**
 * Runs the hero cauldron on every tick, at the tavern cauldron's speed, and hands each finished drink to a hero at home
 * (it waits in the cauldron while nobody can take it). Returns a stop function.
 */
export function startGuildCauldron(world: Pick<World, 'store' | 'bus' | 'clock' | 'station' | 'guild'>): () => void {
  const { guild } = world;
  return world.bus.on('tick', ({ deltaMs }) => {
    guild.station.speed = world.station.speed;
    advanceBrewing(guild.station, deltaMs);
    const drink = guild.station.ready[0];
    if (drink === undefined) return;
    const taker = drinkTaker(world.store.getState(), world.clock.now());
    if (taker === undefined) return;
    guild.station.ready.shift();
    giveDrink(world, taker.id, drink, taker.heals);
  });
}
