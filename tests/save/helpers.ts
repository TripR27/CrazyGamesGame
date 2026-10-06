import type { Clock } from '@/core/clock';
import { createInitialState, type GameState } from '@/core/state';
import { createMemoryAdapter } from '@/save/memory-adapter';
import { createSaveManager } from '@/save/save-manager';
import type { StorageAdapter } from '@/save/storage';

export const clock: Clock = { now: () => 2_000 };

export function setup(storage: StorageAdapter = createMemoryAdapter()) {
  const manager = createSaveManager<GameState>({ storage, clock, createDefault: createInitialState });
  return { storage, manager };
}
