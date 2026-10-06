import type { GameState } from '@/core/state';
import type { Store } from '@/core/store';
import { ingredients } from '@/data/ingredients';
import { recipes, type RecipeDef } from '@/data/recipes';
import { ownedIngredients, type IngredientCatalog } from '@/systems/ingredients';
import { discoverableRecipes } from '@/systems/recipes';

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
