/** All events on the game bus. Add new events here as features arrive. */
export interface GameEvents {
  tick: { deltaMs: number };
  /** Ask the autosave to write now (after purchases, prestige, and other important actions). */
  saveRequested: Record<string, never>;
}
