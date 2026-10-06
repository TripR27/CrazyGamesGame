import type { BrewNotice } from '@/core/game-events';

export interface ActiveBrew {
  recipeId: string;
  remainingMs: number;
  totalMs: number;
}

/** The cauldron and the bar. Runtime only, not saved: a new session starts with an empty cauldron. */
export interface BrewStation {
  /** Ingredient ids currently in the cauldron, in the order they were added. */
  contents: string[];
  brewing: ActiveBrew | null;
  /** Finished drinks (recipe ids) waiting on the bar. */
  ready: string[];
  /** How many finished drinks fit on the bar. */
  capacity: number;
  /** Brew speed factor from upgrades: 2 brews twice as fast. */
  speed: number;
}

/** What happened because of a player action or a tick; published on the bus by the caller. */
export type BrewEvent =
  | { kind: 'started'; recipeId: string }
  | { kind: 'done'; recipeId: string }
  | { kind: 'notice'; notice: BrewNotice; messageKey: string };
