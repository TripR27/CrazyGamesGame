/** Synchronous key-value storage; same shape as localStorage and the CrazyGames data module. */
export interface StorageAdapter {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}
