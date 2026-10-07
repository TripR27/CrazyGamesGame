import { ingredients } from '@/data/ingredients/index';
import { recipes } from '@/data/recipes/index';
import type { RecipeDef } from '@/data/recipes/types';
import type { GameState, Store } from '@/shared/state';
import type { IngredientCatalog } from '@/systems/ingredients/offer';
import { ownedIngredients } from '@/systems/ingredients/owned';
import { discoverableRecipes } from '@/systems/recipes/discovery';

export interface IngredientShelf {
  catalog: IngredientCatalog;
  /** Ingredient ids on the shelf: the basic ones plus what the player bought (read every frame by the scene). */
  getShelf(): readonly string[];
  /** Recipes the player could discover now: level reached and every ingredient on the shelf. */
  getDiscoverable(): readonly RecipeDef[];
}

/** What the player has to brew with, read fresh from the state each time. */
export function createIngredientShelf(store: Store<GameState>): IngredientShelf {
  const catalog: IngredientCatalog = { ingredients, recipes };
  const getShelf = (): readonly string[] => ownedIngredients(store.getState(), ingredients, recipes).map((i) => i.id);
  return {
    catalog,
    getShelf,
    getDiscoverable: () => discoverableRecipes(store.getState(), recipes, getShelf()),
  };
}
