import type { World } from '@/app/world';
import { DUNGEONS, returnHero, sendHero, startTrip } from '@/heroes/expedition';
import { guildBuilt, HERO_CLASSES, HEROES, heroStatus } from '@/heroes/heroes';
import type { EventBus, GameEvents } from '@/shared/events';
import { num } from '@/shared/numbers';
import { type OneTimeOffer, watchBuyable, type WatchSource } from '@/shared/purchases';
import type { GameState } from '@/shared/state';

/** Placeholder numbers, tuned with `npm run simulate`. */
export const QUARTERMASTER = {
  cost: 12_000,
  /**
   * A hero on Auto waits this long at home before setting out again, so the player can still hand them drinks; with a
   * full bag they go at once.
   */
  homeMs: 10_000,
  /** At most this many trips per hero are caught up after a time away (a safety net; the offline limit comes first). */
  maxAwayTrips: 1000,
} as const;

type QuartermasterState = Pick<GameState, 'quartermaster' | 'roomsBuilt' | 'currencies'>;

/** The Quartermaster is sold in the Heroes tab once the guild hall stands, and bought once. */
export function quartermasterOffer(state: QuartermasterState): OneTimeOffer {
  const cost = num(QUARTERMASTER.cost);
  if (state.quartermaster) return { status: 'owned', cost, affordable: false };
  if (!guildBuilt(state)) return { status: 'locked', cost, affordable: false };
  return { status: 'forSale', cost, affordable: state.currencies.gold.gte(cost) };
}

/** Buy the Quartermaster: from now on every hero has an Auto button. Does nothing when it is not for sale or too expensive. */
export function buyQuartermaster({ store, bus }: Pick<World, 'store' | 'bus'>): void {
  const offer = quartermasterOffer(store.getState());
  if (!offer.affordable) return;
  store.update((s) => {
    s.currencies.gold = s.currencies.gold.sub(offer.cost);
    s.quartermaster = true;
  });
  bus.emit('quartermaster:bought', {});
  bus.emit('saveRequested', {});
}

/** Publishes `quartermaster:affordable` each time the Quartermaster becomes buyable. Returns a stop function. */
export function watchQuartermaster(source: WatchSource<QuartermasterState>, bus: EventBus<GameEvents>): () => void {
  return watchBuyable(source, bus, (state) => quartermasterOffer(state).affordable, 'quartermaster:affordable');
}

/**
 * Switch a hero's Auto on or off, at any moment (needs the Quartermaster). Switched off, a hero on a trip finishes it
 * and then waits for the player.
 */
export function setHeroAuto({ store, bus }: Pick<World, 'store' | 'bus'>, heroId: string, on: boolean): void {
  const state = store.getState();
  const hero = state.heroes[heroId];
  if (!state.quartermaster || hero === undefined || hero.auto === on) return;
  store.update((s) => {
    const h = s.heroes[heroId];
    if (h !== undefined) h.auto = on;
  });
  bus.emit('hero:auto', { heroId, on });
  bus.emit('saveRequested', {});
}

/** How long a hero on Auto waits at home: not at all with a full bag. */
const waitAtHome = (bag: readonly string[]): number => (bag.length >= HEROES.bagSize ? 0 : QUARTERMASTER.homeMs);

/**
 * Runs Auto while the game is open: a hero on Auto who is at home and fit sets out again after `homeMs` (the default
 * choices and the default boss outcome follow by themselves). `homeSince` remembers since when each one waits.
 */
function runAuto(world: Pick<World, 'store' | 'bus' | 'rng' | 'clock' | 'content'>, homeSince: Map<string, number>): void {
  const now = world.clock.now();
  for (const def of HERO_CLASSES) {
    const hero = world.store.getState().heroes[def.id];
    if (hero?.auto !== true || heroStatus(hero, now) !== 'home') {
      homeSince.delete(def.id);
      continue;
    }
    const since = homeSince.get(def.id);
    if (since === undefined) homeSince.set(def.id, now);
    else if (now - since >= waitAtHome(hero.bag)) {
      homeSince.delete(def.id);
      sendHero(world, def.id);
    }
  }
}

/** Starts Auto on the tick, after the heroes came back (one line in createWorld). */
export function startAuto(world: Pick<World, 'store' | 'bus' | 'rng' | 'clock' | 'content'>): void {
  const homeSince = new Map<string, number>();
  world.bus.on('tick', () => runAuto(world, homeSince));
}

/** What the heroes on Auto did while the player was away: trips finished and the loot they brought home. */
export interface AwayTrips {
  trips: number;
  loot: Record<string, number>;
}

/**
 * Catches up on a time away (the game was closed or the tab slept): every hero on Auto finishes their trips, rests when
 * hurt, and sets out again, each trip starting when the last one ended, with the default choices. Trips only start
 * within the offline limit (`limitMs` from the moment the player left). Nothing is announced; the welcome-back window
 * sums it up. Heroes not on Auto come back on the next tick as usual.
 */
export function catchUpTrips(world: Pick<World, 'store' | 'bus' | 'rng' | 'clock' | 'content'>, awayMs: number, limitMs: number): AwayTrips {
  const result: AwayTrips = { trips: 0, loot: {} };
  const now = world.clock.now();
  const leftAt = now - awayMs;
  const dungeon = DUNGEONS[0]?.id ?? '';
  for (const def of HERO_CLASSES) {
    let from = leftAt;
    for (let i = 0; i < QUARTERMASTER.maxAwayTrips; i++) {
      const hero = world.store.getState().heroes[def.id];
      if (hero?.auto !== true) break;
      const trip = hero.expedition;
      if (trip !== null) {
        if (trip.endsAt > now) break;
        const loot = returnHero(world, def.id, trip, false);
        for (const [id, n] of Object.entries(loot)) result.loot[id] = (result.loot[id] ?? 0) + n;
        result.trips += 1;
        from = trip.endsAt;
        continue;
      }
      const start = Math.max(from, hero.injuredUntil) + waitAtHome(hero.bag);
      if (start > now || start >= leftAt + limitMs || !startTrip(world, def.id, dungeon, start)) break;
    }
  }
  return result;
}
