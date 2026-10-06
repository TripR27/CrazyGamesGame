import { num, type Num } from '@/core/numbers';
import { STARTER_RECIPE_IDS } from '@/data/recipes/starters';

export interface MetaState {
  createdAt: number;
  lastSeenAt: number;
}

export interface CurrencyState {
  gold: Num;
}

/** Tutorial progress: finished step ids and whether the player skipped the tutorial. */
export interface TutorialProgress {
  completedSteps: string[];
  skipped: boolean;
}

/** Purchased level per upgrade id. An open map: new upgrades need no change here. */
export type UpgradeLevels = Record<string, number>;

export interface GameState {
  meta: MetaState;
  currencies: CurrencyState;
  reputation: number;
  /** Recipe ids the player knows; customers only order these. */
  recipesDiscovered: string[];
  upgrades: UpgradeLevels;
  tutorial: TutorialProgress;
}

export function createInitialState(now: number): GameState {
  return {
    meta: { createdAt: now, lastSeenAt: now },
    currencies: { gold: num(0) },
    reputation: 0,
    recipesDiscovered: [...STARTER_RECIPE_IDS],
    upgrades: {},
    tutorial: { completedSteps: [], skipped: false },
  };
}

/** Remember when the player was last active; offline progress is computed from this. */
export function touchLastSeen(state: GameState, now: number): void {
  state.meta.lastSeenAt = now;
}
