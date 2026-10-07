/** A rectangle in design pixels (1280x720), top-left origin. */
export interface Bounds {
  x: number;
  y: number;
  w: number;
  h: number;
}

/**
 * Things the tutorial can point at. DOM elements and Phaser objects register under an id with a function
 * that returns their current bounds (or null while hidden), so moving objects are followed. A target in a scrolling
 * list also gives a `reveal` function that scrolls it into view.
 */
export interface TargetRegistry {
  /** Returns a function that removes the target again. */
  register(id: string, getBounds: () => Bounds | null, reveal?: () => void): () => void;
  /** Current bounds of the target, or null if it is unknown or not on screen. */
  resolve(id: string): Bounds | null;
  /** Brings the target into view (scrolls its list), when it can; the tutorial calls this when it starts pointing at it. */
  reveal(id: string): void;
}

interface Entry {
  getBounds: () => Bounds | null;
  reveal?: () => void;
}

export function createTargetRegistry(): TargetRegistry {
  const targets = new Map<string, Entry>();
  return {
    register(id, getBounds, reveal) {
      const entry = { getBounds, reveal };
      targets.set(id, entry);
      return () => {
        if (targets.get(id) === entry) targets.delete(id);
      };
    },
    resolve: (id) => targets.get(id)?.getBounds() ?? null,
    reveal: (id) => targets.get(id)?.reveal?.(),
  };
}
