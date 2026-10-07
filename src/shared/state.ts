import { STARTER_RECIPE_IDS } from '@/recipes/recipe-data';
import { num, type Num } from '@/shared/numbers';

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
  /** Ingredient ids bought in the shop (one-time purchases); they stay on the shelf. */
  ingredientsBought: string[];
  /** Room ids built on the upper floor (one-time purchases). */
  roomsBuilt: string[];
  upgrades: UpgradeLevels;
  tutorial: TutorialProgress;
}

export function createInitialState(now: number): GameState {
  return {
    meta: { createdAt: now, lastSeenAt: now },
    currencies: { gold: num(0) },
    reputation: 0,
    recipesDiscovered: [...STARTER_RECIPE_IDS],
    ingredientsBought: [],
    roomsBuilt: [],
    upgrades: {},
    tutorial: { completedSteps: [], skipped: false },
  };
}

/** Remember when the player was last active; offline progress is computed from this. */
export function touchLastSeen(state: GameState, now: number): void {
  state.meta.lastSeenAt = now;
}

export type Listener<S> = (state: S) => void;

export interface Store<S> {
  getState(): S;
  /** Mutate the state inside the callback; subscribers are notified afterwards. */
  update(mutator: (state: S) => void): void;
  subscribe(listener: Listener<S>): () => void;
}

export function createStore<S>(initial: S): Store<S> {
  const state = initial;
  const listeners = new Set<Listener<S>>();

  return {
    getState: () => state,
    update(mutator) {
      mutator(state);
      for (const listener of [...listeners]) listener(state);
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}
