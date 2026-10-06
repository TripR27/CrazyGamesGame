/** Tracks how long the cauldron has held the same unfinished ingredients. */
export interface StaleWatch {
  /** Call every tick; true once the same contents have sat there for the limit. */
  isStale(contents: readonly string[], deltaMs: number): boolean;
}

/**
 * A player who drops one ingredient in and walks away would otherwise block the brewer forever (it never touches
 * the player's work). After `limitMs` without a change the brewer may clear it; a player in the middle of a
 * combination never waits that long.
 */
export function createStaleWatch(limitMs: number): StaleWatch {
  let seen = '';
  let heldMs = 0;
  return {
    isStale(contents, deltaMs) {
      const key = contents.join('+');
      if (contents.length === 0 || key !== seen) {
        seen = key;
        heldMs = 0;
        return false;
      }
      heldMs += deltaMs;
      return heldMs >= limitMs;
    },
  };
}
