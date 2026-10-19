import type { EventBus, GameEvents } from '@/shared/events';
import { type SaveManager, createMemoryAdapter, type StorageAdapter } from '@/shared/save';
import { touchLastSeen, type GameState, type Store } from '@/shared/state';
import type { Ticker, Clock } from '@/shared/time';

const POLL_INTERVAL_MS = 50;

/** Drives a ticker from timers and tab visibility. Returns a stop function. */
export function startLoopDriver(ticker: Ticker): () => void {
  const timer = setInterval(() => ticker.advance(), POLL_INTERVAL_MS);
  const onVisibility = (): void => {
    if (!document.hidden) ticker.advance();
  };
  document.addEventListener('visibilitychange', onVisibility);

  return () => {
    clearInterval(timer);
    document.removeEventListener('visibilitychange', onVisibility);
  };
}

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

export interface DebugCommands {
  /** Play the tutorial again from the start. The Settings button for this arrives in step 18. */
  replayTutorial(): void;
}

/** Makes commands available as `bt.<name>()` in the browser console. Development builds only. */
export function registerDebugCommands(commands: DebugCommands): void {
  if (!import.meta.env.DEV) return;
  (window as unknown as { bt?: DebugCommands }).bt = commands;
}

const SCROLL_KEYS = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' ', 'PageUp', 'PageDown', 'Home', 'End'];

/** Whether the wheel turns over a list that can scroll (the shop, the recipe book): that one may scroll. */
function overScrollList(target: EventTarget | null): boolean {
  for (let el = target instanceof Element ? target : null; el !== null; el = el.parentElement) {
    if (el.scrollHeight > el.clientHeight && /auto|scroll/.test(getComputedStyle(el).overflowY)) return true;
  }
  return false;
}

/**
 * Keys and the wheel never scroll the page around the game's iframe (Poki asks for it). Typing in a text field and the
 * lists in the panels still work; `overscroll-behavior` in index.html keeps a list at its end from scrolling the page.
 */
export function preventPageScroll(): void {
  window.addEventListener('keydown', (event) => {
    const typing = event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement || event.target instanceof HTMLSelectElement;
    if (!typing && SCROLL_KEYS.includes(event.key)) event.preventDefault();
  });
  window.addEventListener('wheel', (event) => !overScrollList(event.target) && event.preventDefault(), { passive: false });
}

const PROBE_KEY = '__bt_probe__';

function usableStorage(candidate?: Storage): Storage | null {
  try {
    const storage = candidate ?? globalThis.localStorage;
    storage.setItem(PROBE_KEY, '1');
    storage.removeItem(PROBE_KEY);
    return storage;
  } catch {
    return null;
  }
}

/** localStorage-backed adapter; falls back to memory when storage is blocked (private mode, sandbox). */
export function createLocalStorageAdapter(candidate?: Storage): StorageAdapter {
  const storage = usableStorage(candidate);
  if (storage === null) return createMemoryAdapter();
  return {
    getItem: (key) => storage.getItem(key),
    setItem: (key, value) => storage.setItem(key, value),
    removeItem: (key) => storage.removeItem(key),
  };
}
