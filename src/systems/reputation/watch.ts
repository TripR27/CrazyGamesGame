import type { EventBus } from '@/core/events';
import type { GameEvents } from '@/core/game-events';
import { levelFor, recipesTaughtUpTo } from './level';

/** The part of the state levels look at and change (interface segregation: not the whole state). */
export interface LevelState {
  reputation: number;
  recipesDiscovered: string[];
}

export interface LevelStore {
  getState(): LevelState;
  update(mutator: (state: LevelState) => void): void;
  subscribe(listener: (state: LevelState) => void): () => void;
}

/** Make sure the player knows every recipe their level teaches. Returns true when something was added. */
function teachRecipes(store: LevelStore, level: number): boolean {
  const missing = recipesTaughtUpTo(level).filter((id) => !store.getState().recipesDiscovered.includes(id));
  if (missing.length === 0) return false;
  store.update((state) => void state.recipesDiscovered.push(...missing));
  return true;
}

/**
 * Follows the reputation: on reaching a new level the player learns its recipes and the game announces it
 * (`reputation:levelUp`), once per level. A save that is already past a level only catches up quietly.
 */
export function watchReputationLevels(store: LevelStore, bus: EventBus<GameEvents>): () => void {
  let level = levelFor(store.getState().reputation);
  if (teachRecipes(store, level)) bus.emit('saveRequested', {});
  return store.subscribe((state) => {
    const now = levelFor(state.reputation);
    if (now <= level) return;
    const from = level;
    level = now;
    teachRecipes(store, now);
    for (let reached = from + 1; reached <= now; reached++) bus.emit('reputation:levelUp', { level: reached });
    bus.emit('saveRequested', {});
  });
}
