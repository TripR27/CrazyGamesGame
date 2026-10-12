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

/** A choice card on a trip: when it opens (wall clock) and the option taken (null while open or still to come). */
export interface TripCard {
  id: string;
  at: number;
  choice: string | null;
  /** The drink handed over by an option that needs one. */
  drink?: string;
}

/**
 * A hero on a trip: which dungeon, the wall-clock time they are back (absolute, so it also runs while the game is closed),
 * the drinks they took along (recipe ids), the choice cards on the way and the boss fight at the end.
 */
export interface Expedition {
  dungeon: string;
  endsAt: number;
  drinks: string[];
  cards: TripCard[];
  /** The fight with the boss at the end, once the player struck: each strike (hit or miss) and when the last one was. */
  boss?: { hits: boolean[]; lastAt: number };
}

/**
 * One hero (keyed by hero class id). `injuredUntil` is a wall-clock time; 0 or past means fit. `gear`: the piece worn
 * per slot (sword, shield, helmet, amulet), an empty slot has no entry.
 */
export interface HeroState {
  level: number;
  xp: number;
  injuredUntil: number;
  expedition: Expedition | null;
  gear: Record<string, string>;
  /** Drinks (recipe ids) waiting to go along on the next trip. */
  bag: string[];
  /** On Auto the hero sets out again by themselves (needs the Quartermaster). */
  auto: boolean;
}

/** Selling the tavern (prestige): what carries over from one tavern to the next. */
export interface PrestigeState {
  /** Golden Hop to spend in the Legacy. */
  hops: number;
  /** Every Golden Hop ever earned; each one makes drinks pricier for good. */
  totalHops: number;
  /** Taverns sold so far. */
  runs: number;
  /** Gold earned in this tavern (serving, and while away): the Golden Hop for selling come from this. */
  runEarned: Num;
  /** Bought level per Legacy bonus (an open map). */
  legacy: Record<string, number>;
}

/** Lifetime counters (they survive selling the tavern); achievements and the Trophies tab read them. */
export interface Stats {
  served: number;
  vipServed: number;
  /** Gold earned in all taverns: what customers paid (tips too) and the staff's pay while away. */
  goldEarned: Num;
  trips: number;
  bossWins: number;
}

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
  /** Decoration ids bought for downstairs (one-time purchases). */
  decorBought: string[];
  /** Shop offers that came in sight in this tavern (`<kind>:<id>`); they stay listed until sold out. The Legacy ones stay when the tavern is sold. */
  shopSeen: string[];
  /** Of those, the ones that came in sight since their tab was last open ("New!"). */
  shopNew: string[];
  upgrades: UpgradeLevels;
  /** The heroes the player has, by hero class id (an open map: the guild hall brings the first). */
  heroes: Record<string, HeroState>;
  /** How many of each dungeon ingredient the player holds; heroes bring them, brewing will use them up. */
  ingredientStock: Record<string, number>;
  /** Gear ids the player owns (bought or found); each piece is worn by at most one hero. */
  gearOwned: string[];
  /** The Quartermaster was bought: heroes can go on Auto. */
  quartermaster: boolean;
  prestige: PrestigeState;
  stats: Stats;
  /** Achievement ids reached (each gives a small bonus for good). */
  achievements: string[];
  /** The daily bonus: the local day number it was last claimed, and how many days in a row. */
  daily: { lastDay: number; streak: number };
  /** Rewarded ads: the power-up running ('' for none) and when it ends, and when the shop's 📺 button was last used. */
  rewards: { boost: string; boostEndsAt: number; shopAdAt: number };
  /** The player's settings: volume 0 to 1, sound off (`muted`, the speaker button) and the language id. */
  settings: { volume: number; muted: boolean; language: string };
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
    decorBought: [],
    shopSeen: [],
    shopNew: [],
    upgrades: {},
    heroes: {},
    ingredientStock: {},
    gearOwned: [],
    quartermaster: false,
    prestige: { hops: 0, totalHops: 0, runs: 0, runEarned: num(0), legacy: {} },
    stats: { served: 0, vipServed: 0, goldEarned: num(0), trips: 0, bossWins: 0 },
    achievements: [],
    daily: { lastDay: 0, streak: 0 },
    rewards: { boost: '', boostEndsAt: 0, shopAdAt: 0 },
    settings: { volume: 0.8, muted: false, language: 'en' },
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
