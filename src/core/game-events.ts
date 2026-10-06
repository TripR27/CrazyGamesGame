/** Why a customer left the tavern. */
export type LeaveReason = 'impatient' | 'served';

/** All events on the game bus. Add new events here as features arrive. */
export interface GameEvents {
  tick: { deltaMs: number };
  /** Ask the autosave to write now (after purchases, prestige, and other important actions). */
  saveRequested: Record<string, never>;
  /** A customer sat down; look the customer up on the floor by `id`. */
  'customer:arrived': { id: number };
  'customer:left': { id: number; reason: LeaveReason };
}
