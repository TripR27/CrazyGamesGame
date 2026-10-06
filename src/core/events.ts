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
