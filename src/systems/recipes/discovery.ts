import type { RecipeDef } from '@/data/recipes/types';
import type { EventBus, GameEvents } from '@/shared/events';
import { levelFor, recipesUnlockedUpTo } from '@/systems/reputation/level';

/** The part of the state discovery looks at and changes (interface segregation: not the whole state). */
export interface DiscoveryState {
  reputation: number;
  recipesDiscovered: string[];
}

export interface DiscoveryStore {
  getState(): DiscoveryState;
  update(mutator: (state: DiscoveryState) => void): void;
}

/** Recipes unlocked by the reputation level that the player does not know yet (whatever ingredients they have). */
export function unlockedUnknownRecipes(state: DiscoveryState, recipes: readonly RecipeDef[]): RecipeDef[] {
  const unlocked = recipesUnlockedUpTo(levelFor(state.reputation));
  return recipes.filter((r) => unlocked.includes(r.id) && !state.recipesDiscovered.includes(r.id));
}

/**
 * Recipes the player can discover right now: unlocked by their level, not known yet, and every ingredient on the
 * shelf (`owned`: the ingredient ids the player has).
 */
export function discoverableRecipes(state: DiscoveryState, recipes: readonly RecipeDef[], owned: readonly string[]): RecipeDef[] {
  return unlockedUnknownRecipes(state, recipes).filter((r) => r.ingredients.every((id) => owned.includes(id)));
}

/** Writes every discovery into the state (and asks for a save), so customers can order it from now on. */
export function recordDiscoveries(store: DiscoveryStore, bus: EventBus<GameEvents>): () => void {
  return bus.on('recipe:discovered', ({ recipeId }) => {
    if (store.getState().recipesDiscovered.includes(recipeId)) return;
    store.update((state) => void state.recipesDiscovered.push(recipeId));
    bus.emit('saveRequested', {});
  });
}
