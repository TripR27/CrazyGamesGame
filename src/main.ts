import { systemClock } from '@/core/clock';
import { debug } from '@/core/debug';
import { createEventBus } from '@/core/events';
import type { GameEvents } from '@/core/game-events';
import { createInitialState, type GameState } from '@/core/state';
import { createStore } from '@/core/store';
import { createTicker } from '@/core/ticker';
import { createGame } from '@/game';
import { createLocalStorageAdapter } from '@/save/local-storage-adapter';
import { createSaveManager } from '@/save/save-manager';
import { startAutosave } from '@/runtime/autosave-driver';
import { startLoopDriver } from '@/runtime/loop-driver';

const clock = systemClock;
const manager = createSaveManager<GameState>({
  storage: createLocalStorageAdapter(),
  clock,
  createDefault: createInitialState,
});
const { state, status } = manager.load();
const store = createStore(state);
const bus = createEventBus<GameEvents>();
const ticker = createTicker({
  clock,
  onStep: (deltaMs) => bus.emit('tick', { deltaMs }),
  onGap: (gapMs) => debug('time gap, offline logic comes in step 10', gapMs),
});

startLoopDriver(ticker);
startAutosave({ store, manager, clock, bus });
debug('save status', status, store.getState());
createGame('game');
