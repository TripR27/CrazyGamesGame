import type { World } from '@/app/world';
import { HERO_CLASSES } from '@/heroes/heroes';
import { drinkPower, effectPower, type TripMods } from '@/heroes/trip-cards';
import type { RecipeDef } from '@/recipes/recipe-data';
import type { Expedition, GameState, HeroState } from '@/shared/state';

/**
 * The boss at the end of a dungeon: how much damage beats them and the boss loot for winning (on top of the trip's loot,
 * as trip mods). Text: `bosses.<id>.name`.
 */
export interface BossDef {
  id: string;
  hp: number;
  loot: Partial<TripMods>;
}

/** Placeholder numbers. The boss of each dungeon, by dungeon id; a new dungeon's boss is one more entry. */
export const BOSSES: Readonly<Record<string, BossDef>> = {
  swamp: { id: 'bog_witch', hp: 3, loot: { extra: { witch_moss: 1, bog_pearl: 1 }, gearChance: 0.03 } },
};

/** Placeholder numbers for the timing bar (positions are shares of the bar, 0 to 1). */
export const BOSS = {
  /** The boss shows up this long before the end of the trip. */
  windowMs: 15_000,
  /** Time for the pointer to cross the bar once, per strike: every strike is faster. */
  swingMs: [1600, 1300, 1000],
  /** Width of the green zone in the middle of the bar; each strength drink (by its power) makes it wider. */
  zone: 0.18,
  zonePerStrength: 0.06,
  maxZone: 0.4,
  /** Damage of one good strike grows with the hero's level. */
  damagePerLevel: 0.1,
  /** A strike keeps the hero at the boss at least this long, so the fight is never cut off by the end of the trip. */
  graceMs: 4000,
} as const;

export const STRIKES = BOSS.swingMs.length;

/** Where the pointer is `sinceMs` after it started a swing: it goes left to right in `swingMs`, then back. */
export function pointerAt(sinceMs: number, swingMs: number): number {
  const phase = (Math.max(0, sinceMs) % (2 * swingMs)) / swingMs;
  return phase <= 1 ? phase : 2 - phase;
}

/** The width of the green zone with these drinks along: strength drinks widen it. */
export const zoneWidth = (strength: number): number => Math.min(BOSS.maxZone, BOSS.zone + BOSS.zonePerStrength * strength);

/** True when a pointer at `pos` is in a green zone of this width (centred on the bar). */
export const inZone = (pos: number, width: number): boolean => Math.abs(pos - 0.5) <= width / 2;

/** The damage of one good strike: the class's power against bosses, more with every level. */
export function strikeDamage(heroId: string, level: number): number {
  const power = HERO_CLASSES.find((c) => c.id === heroId)?.bossPower ?? 1;
  return power * (1 + BOSS.damagePerLevel * (level - 1));
}

/** When the boss of this trip shows up (the trip's end time can still move, so it is not saved). */
export const bossOpensAt = (trip: Expedition): number => trip.endsAt - BOSS.windowMs;

const hitCount = (trip: Expedition): number => trip.boss?.hits.filter(Boolean).length ?? 0;
const finished = (trip: Expedition): boolean => (trip.boss?.hits.length ?? 0) >= STRIKES;

/** The boss is on screen: its time has come, the trip is not over and the fight is not finished. */
export const bossOpen = (trip: Expedition, now: number): boolean => now >= bossOpensAt(trip) && now < trip.endsAt && !finished(trip);

/** The first hero (in class order) whose boss is on screen right now, with the trip; undefined when none. */
export function currentBoss(state: Pick<GameState, 'heroes'>, now: number): { heroId: string; trip: Expedition } | undefined {
  for (const def of HERO_CLASSES) {
    const trip = state.heroes[def.id]?.expedition;
    if (trip != null && trip.dungeon in BOSSES && bossOpen(trip, now)) return { heroId: def.id, trip };
  }
  return undefined;
}

/** The timing bar of a fight: where the pointer is and how wide the green zone is (shares of the bar). */
export interface BossBar {
  pointer: number;
  zone: number;
}

/**
 * Fills `out` with the bar as it is now for this hero's fight (the view calls it every frame, so it reuses one object).
 * Each strike starts a new, faster swing.
 */
export function bossBar(recipes: readonly RecipeDef[], heroId: string, hero: Pick<HeroState, 'gear'>, trip: Expedition, now: number, out: BossBar): BossBar {
  const strikes = trip.boss?.hits.length ?? 0;
  const swing = BOSS.swingMs[Math.min(strikes, STRIKES - 1)] ?? BOSS.swingMs[0];
  out.pointer = pointerAt(now - (trip.boss?.lastAt ?? bossOpensAt(trip)), swing);
  out.zone = zoneWidth(effectPower(recipes, trip.drinks, 'strength', drinkPower(heroId, hero)));
  return out;
}

/**
 * How the fight went: null when the player did not fight (the default outcome), otherwise won or lost. Strikes not made
 * before the hero came back count as misses.
 */
export function bossResult(heroId: string, level: number, trip: Expedition): 'won' | 'lost' | null {
  const boss = BOSSES[trip.dungeon];
  if (boss === undefined || trip.boss === undefined || trip.boss.hits.length === 0) return null;
  return hitCount(trip) * strikeDamage(heroId, level) >= boss.hp - 1e-9 ? 'won' : 'lost';
}

/** What the fight adds to the trip: the boss loot for a win, nothing otherwise. */
export function bossMods(result: 'won' | 'lost' | null, dungeonId: string): Partial<TripMods> {
  return result === 'won' ? (BOSSES[dungeonId]?.loot ?? {}) : {};
}

/**
 * One strike at the boss of a hero's trip: a hit when the pointer is in the green zone right now. The fight keeps the
 * hero there a little longer if needed; after the last strike `boss:resolved` says how it went.
 */
export function strikeBoss({ store, bus, clock, content }: Pick<World, 'store' | 'bus' | 'clock' | 'content'>, heroId: string): void {
  const now = clock.now();
  const hero = store.getState().heroes[heroId];
  const trip = hero?.expedition;
  if (hero === undefined || trip == null || !(trip.dungeon in BOSSES) || !bossOpen(trip, now)) return;
  const bar = bossBar(content.recipes, heroId, hero, trip, now, { pointer: 0, zone: 0 });
  const hit = inZone(bar.pointer, bar.zone);
  store.update((s) => {
    const t = s.heroes[heroId]?.expedition;
    if (t == null) return;
    t.boss ??= { hits: [], lastAt: now };
    t.boss.hits.push(hit);
    t.boss.lastAt = now;
    if (!finished(t)) t.endsAt = Math.max(t.endsAt, now + BOSS.graceMs);
  });
  bus.emit('boss:struck', { heroId, hit });
  const after = store.getState().heroes[heroId]?.expedition;
  if (after != null && finished(after)) bus.emit('boss:resolved', { heroId, result: bossResult(heroId, hero.level, after) });
  bus.emit('saveRequested', {});
}

/** Announces a boss once their time comes (`announced` remembers the trips shown). */
export function runBoss({ store, bus, clock }: Pick<World, 'store' | 'bus' | 'clock'>, announced: Set<object>): void {
  const now = clock.now();
  for (const def of HERO_CLASSES) {
    const trip = store.getState().heroes[def.id]?.expedition;
    if (trip == null || announced.has(trip) || !(trip.dungeon in BOSSES) || !bossOpen(trip, now)) continue;
    announced.add(trip);
    bus.emit('boss:opened', { heroId: def.id, dungeon: trip.dungeon });
  }
}
