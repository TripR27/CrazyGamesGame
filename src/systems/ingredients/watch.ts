import type { EventBus, GameEvents } from '@/shared/events';
import { firstBuyableIngredient, type IngredientCatalog, type IngredientShopState } from '@/systems/ingredients/offer';
import { watchBuyable, type WatchSource } from '@/systems/purchases/watch';

/** Publishes `ingredients:affordable` each time an ingredient becomes buyable. Returns a stop function. */
export function watchIngredientShop(source: WatchSource<IngredientShopState>, bus: EventBus<GameEvents>, catalog: IngredientCatalog): () => void {
  return watchBuyable(source, bus, (state) => firstBuyableIngredient(state, catalog) !== undefined, 'ingredients:affordable');
}
