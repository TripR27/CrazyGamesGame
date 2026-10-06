import { systemClock } from '@/core/clock';
import { debug } from '@/core/debug';
import { createEventBus } from '@/core/events';
import type { GameEvents } from '@/core/game-events';
import { createInitialState } from '@/core/state';
import { createStore } from '@/core/store';
import { createTicker } from '@/core/ticker';
import { createGame } from '@/game';
import { startLoopDriver } from '@/runtime/loop-driver';

const store = createStore(createInitialState(systemClock.now()));
const bus = createEventBus<GameEvents>();
const ticker = createTicker({
  clock: systemClock,
  onStep: (deltaMs) => bus.emit('tick', { deltaMs }),
  onGap: (gapMs) => debug('time gap, offline logic comes in step 10', gapMs),
});

startLoopDriver(ticker);
debug('state', store.getState());
createGame('game');
