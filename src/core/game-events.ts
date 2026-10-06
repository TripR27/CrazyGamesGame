import type { Num } from '@/core/numbers';

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
  'customer:served': { id: number; seat: number; recipeId: string; gold: Num; messageKey: string };
  'customer:refused': { id: number; seat: number; recipeId: string; reason: RefuseReason; messageKey: string };
  'ingredient:clicked': { id: string };
  'brew:started': { recipeId: string };
  'brew:done': { recipeId: string };
  'brew:notice': { notice: BrewNotice; messageKey: string };
  /** The player can pay for an upgrade after not being able to; fires on each such moment. */
  'upgrade:affordable': Record<string, never>;
  'upgrade:bought': { id: string; count: number };
  /** Same as `upgrade:affordable`, but for staff: the player can pay for a hire or a training level. */
  'staff:affordable': Record<string, never>;
  /** A staff upgrade was bought (a hire or a training level). */
  'staff:hired': { id: string };
  /** The shop panel was opened or closed (the tutorial follows this). */
  'shop:opened': Record<string, never>;
  'shop:closed': Record<string, never>;
}
