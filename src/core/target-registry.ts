/** A rectangle in design pixels (1280x720), top-left origin. */
export interface Bounds {
  x: number;
  y: number;
  w: number;
  h: number;
}

/**
 * Things the tutorial can point at. DOM elements and Phaser objects register under an id with a function
 * that returns their current bounds (or null while hidden), so moving objects are followed.
 */
export interface TargetRegistry {
  /** Returns a function that removes the target again. */
  register(id: string, getBounds: () => Bounds | null): () => void;
  /** Current bounds of the target, or null if it is unknown or not on screen. */
  resolve(id: string): Bounds | null;
}

export function createTargetRegistry(): TargetRegistry {
  const targets = new Map<string, () => Bounds | null>();
  return {
    register(id, getBounds) {
      targets.set(id, getBounds);
      return () => {
        if (targets.get(id) === getBounds) targets.delete(id);
      };
    },
    resolve: (id) => targets.get(id)?.() ?? null,
  };
}
