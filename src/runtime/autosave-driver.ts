import type { Clock } from '@/core/clock';
import type { EventBus } from '@/core/events';
import type { GameEvents } from '@/core/game-events';
import { touchLastSeen, type GameState } from '@/core/state';
import type { Store } from '@/core/store';
import type { SaveManager } from '@/save/save-manager';

export const AUTOSAVE_INTERVAL_MS = 30_000;

export interface AutosaveOptions {
  store: Store<GameState>;
  manager: SaveManager<GameState>;
  clock: Clock;
  bus: EventBus<GameEvents>;
  intervalMs?: number;
}

/** Saves on a timer, when the tab is hidden or closed, and when saveRequested is emitted. Returns a stop function. */
export function startAutosave(options: AutosaveOptions): () => void {
  const { store, manager, clock, bus } = options;

  const saveNow = (): void => {
    store.update((state) => touchLastSeen(state, clock.now()));
    manager.save(store.getState());
  };
  const onVisibility = (): void => {
    if (document.hidden) saveNow();
  };

  const timer = setInterval(saveNow, options.intervalMs ?? AUTOSAVE_INTERVAL_MS);
  const offRequest = bus.on('saveRequested', saveNow);
  document.addEventListener('visibilitychange', onVisibility);
  window.addEventListener('beforeunload', saveNow);

  return () => {
    clearInterval(timer);
    offRequest();
    document.removeEventListener('visibilitychange', onVisibility);
    window.removeEventListener('beforeunload', saveNow);
  };
}
