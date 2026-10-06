import type { EventBus } from '@/core/events';
import type { GameEvents } from '@/core/game-events';
import { firstBuyableIngredient, type IngredientCatalog, type IngredientShopState } from './offer';

export interface IngredientShopSource {
  getState(): IngredientShopState;
  subscribe(listener: () => void): () => void;
}

/**
 * Publishes `ingredients:affordable` each time the player goes from "no ingredient to buy" to "can buy one"
 * (a new level opened one up, or the gold became enough). The tutorial starts its hint on this. Returns a stop function.
 */
export function watchIngredientShop(source: IngredientShopSource, bus: EventBus<GameEvents>, catalog: IngredientCatalog): () => void {
  const can = (): boolean => firstBuyableIngredient(source.getState(), catalog) !== undefined;
  let could = can();
  return source.subscribe(() => {
    const now = can();
    if (now && !could) bus.emit('ingredients:affordable', {});
    could = now;
  });
}
