import { REPUTATION_LEVELS, type ReputationLevel } from '@/data/reputation/levels';

/** The level for this much reputation: 1 is the first level. Levels are passed in so tests can use their own. */
export function levelFor(reputation: number, levels: readonly ReputationLevel[] = REPUTATION_LEVELS): number {
  return Math.max(1, levels.filter((l) => l.minReputation <= reputation).length);
}

export interface LevelProgress {
  level: number;
  current: ReputationLevel;
  /** Undefined at the top level. */
  next: ReputationLevel | undefined;
  /** How far towards the next level, 0 to 1 (1 at the top level). */
  fraction: number;
}

/** Where the player stands: the level, the next one and how far along the way (for the HUD). */
export function levelProgress(reputation: number, levels: readonly ReputationLevel[] = REPUTATION_LEVELS): LevelProgress {
  const level = levelFor(reputation, levels);
  const current = levels[level - 1] ?? { id: '', minReputation: 0 };
  const next = levels[level];
  const span = next === undefined ? 0 : next.minReputation - current.minReputation;
  const fraction = span <= 0 ? 1 : Math.min(1, (reputation - current.minReputation) / span);
  return { level, current, next, fraction };
}

/** Every recipe the levels up to and including `level` teach, in level order. */
export function recipesTaughtUpTo(level: number, levels: readonly ReputationLevel[] = REPUTATION_LEVELS): string[] {
  return levels.slice(0, level).flatMap((l) => l.teaches ?? []);
}
