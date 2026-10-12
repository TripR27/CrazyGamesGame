import type { Num } from '@/shared/numbers';

type Handler<T> = (payload: T) => void;

export interface EventBus<E> {
  /** Subscribe to an event. Returns a function that removes the subscription. */
  on<K extends keyof E>(event: K, handler: Handler<E[K]>): () => void;
  emit<K extends keyof E>(event: K, payload: E[K]): void;
}

export function createEventBus<E extends object>(): EventBus<E> {
  const handlers = new Map<keyof E, Set<Handler<unknown>>>();

  return {
    on(event, handler) {
      const set = handlers.get(event) ?? new Set<Handler<unknown>>();
      set.add(handler as Handler<unknown>);
      handlers.set(event, set);
      return () => set.delete(handler as Handler<unknown>);
    },
    emit(event, payload) {
      for (const handler of [...(handlers.get(event) ?? [])]) handler(payload);
    },
  };
}

/** Why a customer left the tavern. */
export type LeaveReason = 'impatient' | 'served';
/**
 * Small cauldron messages: it is busy, the bar is full, the combination failed, a dungeon ingredient ran out, or no hero
 * at home can take a drink from the hero cauldron.
 */
export type BrewNotice = 'busy' | 'full' | 'fizzle' | 'empty' | 'nohero';
export type RefuseReason = 'nothing-ready' | 'wrong-drink';

/** All events on the game bus. Add new events here as features arrive. */
export interface GameEvents {
  tick: { deltaMs: number };
  /** Ask the autosave to write now (after purchases, prestige, and other important actions). */
  saveRequested: Record<string, never>;
  /** A customer sat down; look the customer up on the floor by `id`. */
  'customer:arrived': { id: number };
  'customer:left': { id: number; reason: LeaveReason };
  /** `gold` is the price (strength included), `tip` comes on top (luck), `extraReputation` too (charm). */
  'customer:served': {
    id: number;
    seat: number;
    recipeId: string;
    gold: Num;
    tip: Num;
    extraReputation: number;
    liked: boolean;
    vip: boolean;
    messageKey: string;
  };
  'customer:refused': { id: number; seat: number; recipeId: string; reason: RefuseReason; messageKey: string };
  /** A customer sat down and ordered a drink whose effect they like (it counts double). */
  'likes:ordered': { id: number };
  /** A customer got a drink they like. */
  'likes:served': { id: number };
  /** A VIP sat down, and a VIP got their drink. */
  'vip:arrived': { id: number };
  'vip:served': { id: number };
  /** The player reached a new reputation level (1 is the first); fired once for every level on the way. */
  'reputation:levelUp': { level: number };
  'ingredient:clicked': { id: string };
  /** The player picked a finished drink up from the bar, to hand it to a customer next. */
  'drink:picked': { recipeId: string };
  /** The player brewed a recipe for the first time ("Eureka!"); it is known from now on. */
  'recipe:discovered': { recipeId: string };
  'brew:started': { recipeId: string };
  'brew:done': { recipeId: string };
  'brew:notice': { notice: BrewNotice; messageKey: string };
  /** The brewer started a drink in their own kettle, and put a finished one on the bar. */
  'brewer:started': { recipeId: string };
  'brewer:done': { recipeId: string };
  /** A drink from the bar went into the slop bucket: tipped by the player, or by the staff clearing a clogged bar. */
  'drink:discarded': { recipeId: string; by: 'player' | 'staff'; messageKey: string };
  /** The player can pay for an upgrade after not being able to; fires on each such moment. */
  'upgrade:affordable': Record<string, never>;
  'upgrade:bought': { id: string; count: number };
  /** Same as `upgrade:affordable`, but for staff: the player can pay for a hire or a training level. */
  'staff:affordable': Record<string, never>;
  /** Same again for the first extra seat. */
  'seats:affordable': Record<string, never>;
  'seats:bought': { id: string };
  /** An ingredient in the shop can be bought (after not being able to); and one was bought (one time each). */
  'ingredients:affordable': Record<string, never>;
  'ingredient:bought': { id: string };
  /** Same for the rooms on the upper floor; `room:built` once per room. */
  'rooms:affordable': Record<string, never>;
  'room:built': { id: string };
  /** Same for the decorations downstairs; `decor:bought` once per decoration. */
  'decor:affordable': Record<string, never>;
  'decor:bought': { id: string };
  /** Something in the scene (a boarded-up room) asks the side panel to open on the Shop tab. */
  'shop:requested': Record<string, never>;
  /** A hero joined: the warrior when the guild hall is built, others when hired. */
  'hero:recruited': { id: string };
  /** A hero left for a dungeon, and came back with loot and XP (`level` is their level now; `injured`: they rest first). */
  'hero:departed': { id: string; dungeon: string };
  'hero:returned': {
    id: string;
    dungeon: string;
    loot: Readonly<Record<string, number>>;
    /** A piece of gear found on the way, or null. */
    gear: string | null;
    xp: number;
    level: number;
    levelUp: boolean;
    injured: boolean;
    /** How the boss fight went, or null when the player did not fight (the default outcome). */
    boss: 'won' | 'lost' | null;
  };
  /** Gear in the Heroes tab: a piece can be bought (after not being able to), was bought, or was put on a hero. */
  'gear:affordable': Record<string, never>;
  'gear:bought': { id: string };
  'gear:equipped': { heroId: string; id: string };
  /** An injured hero drank a drink from the bar and is fit again. */
  'hero:healed': { id: string; recipeId: string };
  /** A drink went into a hero's bag (from the hero cauldron or the bar). */
  'hero:drink': { id: string; recipeId: string };
  /** The hero cauldron in the guild hall was clicked: the next ingredients go into it (`aimed`) or back to the tavern. */
  'guild:aimed': { aimed: boolean };
  /** A choice card opened on a hero's trip, and it was decided (`picked`: by the player, otherwise the safe default). */
  'card:opened': { heroId: string; cardId: string };
  'card:resolved': { heroId: string; cardId: string; optionId: string; picked: boolean };
  /**
   * The boss at the end of a hero's trip showed up, was struck (`hit`: in the green zone), and the fight is over: after the
   * last strike, or when the hero came back first (`result` null: the player did not fight).
   */
  'boss:opened': { heroId: string; dungeon: string };
  'boss:struck': { heroId: string; hit: boolean };
  'boss:resolved': { heroId: string; result: 'won' | 'lost' | null };
  /** The Quartermaster in the Heroes tab can be bought (after not being able to), was bought, and a hero's Auto was switched. */
  'quartermaster:affordable': Record<string, never>;
  'quartermaster:bought': Record<string, never>;
  'hero:auto': { heroId: string; on: boolean };
  /** The staff's earnings while the player was away were paid out. */
  'offline:paid': { gold: Num };
  /**
   * The tavern can be sold (after not being able to), it was sold for `hops` Golden Hop, and a Legacy bonus was bought.
   * The Legacy tab came on screen or went off it.
   */
  'prestige:available': Record<string, never>;
  'prestige:done': { hops: number };
  'legacy:bought': { id: string };
  'legacy:opened': Record<string, never>;
  'legacy:closed': Record<string, never>;
  /** An achievement was reached; `big`: one of the great moments (the platform celebrates those later). */
  'achievement:unlocked': { id: string; big: boolean };
  /** The Trophies tab came on screen or went off it. */
  'trophies:opened': Record<string, never>;
  'trophies:closed': Record<string, never>;
  /** The daily bonus can be claimed (a new day began), and it was claimed: day `day` of the streak, for `gold`. */
  'daily:available': Record<string, never>;
  'daily:claimed': { day: number; gold: Num };
  /** The settings window opened, and a whole game replaced the current one (a reset or an import); the page reloads. */
  'settings:opened': Record<string, never>;
  'game:replaced': Record<string, never>;
  /** Something in the scene (a hero in the guild hall) asks the side panel to open on the Heroes tab. */
  'heroes:requested': Record<string, never>;
  /** The Heroes tab came on screen or went off it. */
  'heroes:opened': Record<string, never>;
  'heroes:closed': Record<string, never>;
  /** A staff upgrade was bought (a hire or a training level). */
  'staff:hired': { id: string };
  /** Something new came in sight in the shop while the side panel is folded away (the Menu button gets a dot). */
  'shop:new': Record<string, never>;
  /** The shop panel was opened or closed (the tutorial follows this). */
  'shop:opened': Record<string, never>;
  'shop:closed': Record<string, never>;
  /** Same for the recipe book. */
  'book:opened': Record<string, never>;
  'book:closed': Record<string, never>;
}

/** Logs in development only; removed from production builds. */
export function debug(...args: unknown[]): void {
  if (import.meta.env.DEV) {
    // eslint-disable-next-line no-console
    console.debug('[bt]', ...args);
  }
}
