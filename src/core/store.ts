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
