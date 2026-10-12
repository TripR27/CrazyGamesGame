import { createGame } from '@/app/tavern-scene';
import { FONT } from '@/config';
import { createSideLayout } from '@/app/ui-model';
import { placeGame, mountUi } from '@/app/viewport-view';
import { createWorld } from '@/app/world';
import { createCrazyGamesPlatform } from '@/platform/crazygames';
import { createAds, createGameplay, createMockPlatform, startPlatform } from '@/platform/platform';
import { createLocalStorageAdapter, startAutosave, registerDebugCommands, startLoopDriver } from '@/shared/browser';
import { debug, createEventBus, type GameEvents } from '@/shared/events';
import { systemRng } from '@/shared/random';
import { createSaveManager } from '@/shared/save';
import { createInitialState, type GameState, createStore } from '@/shared/state';
import { systemClock, createTicker } from '@/shared/time';

const clock = systemClock;
// CrazyGames when the SDK is there (its data module keeps the save), otherwise the stand-in and localStorage.
const platform = (await createCrazyGamesPlatform()) ?? createMockPlatform();
platform.loadingStart();
const manager = createSaveManager<GameState>({
  storage: platform.storage ?? createLocalStorageAdapter(),
  clock,
  createDefault: createInitialState,
});
const { state, status } = manager.load();
const store = createStore(state);
const bus = createEventBus<GameEvents>();
const world = createWorld({ store, bus, rng: systemRng, clock });
// Gameplay stops while the tab is hidden or an ad plays; during an ad the game is paused (its time is skipped).
const gameplay = createGameplay(platform, ['loading']);
const ads = createAds(platform, clock, (paused) => gameplay.pause('ad', paused));
startPlatform(world, platform, ads);
document.addEventListener('visibilitychange', () => gameplay.pause('hidden', document.hidden));
// Time the tab was throttled or the computer slept is counted with the offline formulas, not simulated.
const ticker = createTicker({
  clock,
  onStep: (deltaMs) => bus.emit('tick', { deltaMs }),
  onGap: (gapMs) => world.offline.handleAway(gapMs),
});
// The time since the last save (the game was closed) goes through the same formulas.
if (status === 'loaded') world.offline.handleAway(clock.now() - state.meta.lastSeenAt);
startLoopDriver({ advance: () => (ads.playing() ? ticker.skip() : ticker.advance()), skip: () => ticker.skip() });
startAutosave({ store, manager, clock, bus });
debug('save status', status, platform.environment, store.getState());
const layout = createSideLayout();
// Text in the canvas needs the pixel font before it is drawn; after a moment the game starts anyway (with the fallback).
const FONT_WAIT_MS = 1500;
await Promise.race([document.fonts.load(`16px ${FONT}`), new Promise((resolve) => window.setTimeout(resolve, FONT_WAIT_MS))]);
const game = createGame('game', world);
registerDebugCommands({ replayTutorial: () => world.tutorial.machine.restart() });
const saves = { exportCode: () => manager.exportString(store.getState()), importCode: (code: string) => manager.importString(code) };
mountUi(
  document.getElementById('ui-root') as HTMLElement,
  world,
  layout,
  (fit) =>
    placeGame(document.getElementById('game') as HTMLElement, fit, () => {
      game.scale.getParentBounds();
      game.scale.refresh();
    }),
  { saves, ads, silenced: () => platform.muted() || ads.playing(), username: () => platform.username() },
);
platform.loadingStop();
gameplay.pause('loading', false);
