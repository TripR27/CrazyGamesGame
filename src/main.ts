import { systemClock } from '@/core/clock';
import { debug } from '@/core/debug';
import { createEventBus } from '@/core/events';
import type { GameEvents } from '@/core/game-events';
import { systemRng } from '@/core/rng';
import { createInitialState, type GameState } from '@/core/state';
import { createStore } from '@/core/store';
import { createTicker } from '@/core/ticker';
import { customers } from '@/data/customers';
import { recipes } from '@/data/recipes';
import { createGame } from '@/game';
import { createLocalStorageAdapter } from '@/save/local-storage-adapter';
import { createSaveManager } from '@/save/save-manager';
import { startAutosave } from '@/runtime/autosave-driver';
import { startLoopDriver } from '@/runtime/loop-driver';
import { CUSTOMER_SLOTS } from '@/scene/layout';
import { createFloor, startCustomerSystem } from '@/systems/customers';
import { mountUi } from '@/ui/mount';

const clock = systemClock;
const manager = createSaveManager<GameState>({
  storage: createLocalStorageAdapter(),
  clock,
  createDefault: createInitialState,
});
const { state, status } = manager.load();
const store = createStore(state);
const bus = createEventBus<GameEvents>();
const floor = createFloor(CUSTOMER_SLOTS.length);
const ticker = createTicker({
  clock,
  onStep: (deltaMs) => bus.emit('tick', { deltaMs }),
  onGap: (gapMs) => debug('time gap, offline logic comes in step 10', gapMs),
});

startCustomerSystem({
  floor,
  bus,
  rng: systemRng,
  catalog: { customerTypes: customers, recipes },
  getContext: () => ({
    reputation: store.getState().reputation,
    unlockedRecipeIds: store.getState().recipesDiscovered,
  }),
});
startLoopDriver(ticker);
startAutosave({ store, manager, clock, bus });
debug('save status', status, store.getState());
createGame('game', { bus, floor });
mountUi(document.getElementById('ui-root') as HTMLElement, store);
