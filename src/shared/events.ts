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
/** Small cauldron messages: it is busy, the bar is full, or the combination failed. */
export type BrewNotice = 'busy' | 'full' | 'fizzle';
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
  /** Something in the scene (a boarded-up room) asks the side panel to open on the Shop tab. */
  'shop:requested': Record<string, never>;
  /** A staff upgrade was bought (a hire or a training level). */
  'staff:hired': { id: string };
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
