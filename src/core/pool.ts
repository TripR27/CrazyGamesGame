export interface Pool<T> {
  /** Reuse a released item when there is one, otherwise create a new one. */
  acquire(): T;
  release(item: T): void;
  /** Number of items waiting to be reused. */
  idleCount(): number;
}

export interface PoolOptions<T> {
  create(): T;
  /** Called when an item is released, to hide it and clear its state. */
  reset?(item: T): void;
}

export function createPool<T>({ create, reset }: PoolOptions<T>): Pool<T> {
  const idle: T[] = [];
  return {
    acquire: () => idle.pop() ?? create(),
    release(item) {
      reset?.(item);
      idle.push(item);
    },
    idleCount: () => idle.length,
  };
}
