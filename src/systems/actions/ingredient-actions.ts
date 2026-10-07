import type { EventBus, GameEvents } from '@/shared/events';
import { buyIngredient, type IngredientCatalog, type IngredientShopStore } from '@/systems/ingredients/offer';

export interface IngredientActions {
  /** Buy an ingredient in the shop (one time); does nothing when it is locked, owned or too expensive. */
  buyIngredient(ingredientId: string): void;
}

export interface IngredientActionDeps {
  bus: EventBus<GameEvents>;
  store: IngredientShopStore;
  catalog: IngredientCatalog;
}

export function createIngredientActions({ bus, store, catalog }: IngredientActionDeps): IngredientActions {
  return {
    buyIngredient(ingredientId) {
      const def = catalog.ingredients.find((i) => i.id === ingredientId);
      if (def === undefined || !buyIngredient(store, def, catalog)) return;
      bus.emit('ingredient:bought', { id: def.id });
      bus.emit('saveRequested', {});
    },
  };
}
