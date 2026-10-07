import { createGame } from '@/app/tavern-scene';
import { createSideLayout } from '@/app/ui-model';
import { placeGame, mountUi } from '@/app/viewport-view';
import { createServices } from '@/app/world';
import { customers } from '@/customers/customer-data';
import { toLevelUpView } from '@/reputation/reputation';
import { createLocalStorageAdapter, startAutosave, registerDebugCommands, startLoopDriver } from '@/shared/browser';
import { debug, createEventBus, type GameEvents } from '@/shared/events';
import { systemRng } from '@/shared/random';
import { createSaveManager } from '@/shared/save';
import { createInitialState, type GameState, createStore } from '@/shared/state';
import { systemClock, createTicker } from '@/shared/time';

const clock = systemClock;
const manager = createSaveManager<GameState>({
  storage: createLocalStorageAdapter(),
  clock,
  createDefault: createInitialState,
});
const { state, status } = manager.load();
const store = createStore(state);
const bus = createEventBus<GameEvents>();
const world = createServices({ store, bus, rng: systemRng, clock });
// Time the tab was throttled or the computer slept is counted with the offline formulas, not simulated.
const ticker = createTicker({
  clock,
  onStep: (deltaMs) => bus.emit('tick', { deltaMs }),
  onGap: (gapMs) => world.offline.handleAway(gapMs),
});
// The time since the last save (the game was closed) goes through the same formulas.
if (status === 'loaded') world.offline.handleAway(clock.now() - state.meta.lastSeenAt);
startLoopDriver(ticker);
startAutosave({ store, manager, clock, bus });
debug('save status', status, store.getState());
const layout = createSideLayout();
const game = createGame('game', world.scene);
registerDebugCommands({ replayTutorial: () => world.tutorial.machine.restart() });
mountUi(document.getElementById('ui-root') as HTMLElement, {
  source: store,
  actions: world.scene.actions,
  tutorial: world.tutorial,
  targets: world.targets,
  layout,
  welcome: world.offline.inbox,
  onLevelUp: (show) => bus.on('reputation:levelUp', ({ level }) => show(toLevelUpView(level, customers))),
  onShopRequest: (open) => bus.on('shop:requested', open),
  onFit: (fit) =>
    placeGame(document.getElementById('game') as HTMLElement, fit, () => {
      game.scale.getParentBounds();
      game.scale.refresh();
    }),
});
