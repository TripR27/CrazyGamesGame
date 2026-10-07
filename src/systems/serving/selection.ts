import type { BrewStation } from '@/systems/brewing/types';

/**
 * The drink the player picked up from the bar, waiting to be handed to a customer. Runtime only. A pick is a
 * kind of drink (a recipe id): it stays valid while such a drink stands on the bar, and lapses by itself when
 * the last one is gone (for example because the waitress served it).
 */
export interface DrinkSelection {
  /** The picked recipe id, or null. */
  selected(): string | null;
  /** Pick this drink, or put it back when it was already picked. Returns the pick afterwards. */
  toggle(recipeId: string): string | null;
  clear(): void;
}

export function createDrinkSelection(station: Pick<BrewStation, 'ready'>): DrinkSelection {
  let picked: string | null = null;
  const selected = (): string | null => {
    if (picked !== null && !station.ready.includes(picked)) picked = null;
    return picked;
  };
  return {
    selected,
    toggle(recipeId) {
      picked = selected() === recipeId || !station.ready.includes(recipeId) ? null : recipeId;
      return picked;
    },
    clear() {
      picked = null;
    },
  };
}
