import type { BrewEvent, BrewStation } from '@/systems/brewing/types';

/** Run the brew timer. When it ends, the drink goes onto the bar. */
export function advanceBrewing(station: BrewStation, deltaMs: number): BrewEvent[] {
  const brew = station.brewing;
  if (brew === null) return [];
  brew.remainingMs -= deltaMs;
  if (brew.remainingMs > 0) return [];
  station.brewing = null;
  station.ready.push(brew.recipeId);
  return [{ kind: 'done', recipeId: brew.recipeId }];
}

/** 0 to 1, how far the current brew is; 0 when nothing is brewing. */
export function brewProgress(station: BrewStation): number {
  const brew = station.brewing;
  return brew === null ? 0 : 1 - Math.max(0, brew.remainingMs) / brew.totalMs;
}
