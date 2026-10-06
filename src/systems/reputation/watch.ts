import type { EventBus } from '@/core/events';
import type { GameEvents } from '@/core/game-events';
import { levelFor } from './level';

/** The part of the state levels look at (interface segregation: not the whole state). */
export interface LevelState {
  reputation: number;
}

export interface LevelStore {
  getState(): LevelState;
  subscribe(listener: (state: LevelState) => void): () => void;
}

/**
 * Follows the reputation and announces every new level once (`reputation:levelUp`), also after a big jump.
 * What a level opens up (customers, recipes to discover) is read from the level data itself, so nothing is
 * copied into the state here.
 */
export function watchReputationLevels(store: LevelStore, bus: EventBus<GameEvents>): () => void {
  let level = levelFor(store.getState().reputation);
  return store.subscribe((state) => {
    const now = levelFor(state.reputation);
    if (now <= level) return;
    const from = level;
    level = now;
    for (let reached = from + 1; reached <= now; reached++) bus.emit('reputation:levelUp', { level: reached });
    bus.emit('saveRequested', {});
  });
}
