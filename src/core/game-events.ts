/** All events on the game bus. Add new events here as features arrive. */
export interface GameEvents {
  tick: { deltaMs: number };
}
