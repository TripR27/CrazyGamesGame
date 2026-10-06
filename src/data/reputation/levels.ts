import type { RecipeId } from '@/data/recipes/types';

/**
 * A reputation level. The name is the i18n text `reputation.<id>.name`. Customer types open up by level
 * (`minLevel`), and a level unlocks recipes: from then on the player can discover them in the cauldron.
 * Rooms (step 14) will use the level too.
 */
export interface ReputationLevel {
  id: string;
  /** Reputation needed to reach this level; the first level starts at 0. */
  minReputation: number;
  /** Recipes that can be discovered from this level on. */
  unlocks?: readonly RecipeId[];
}

/**
 * In order, from the first level up. Placeholder thresholds; tuned in step 13. The first level unlocks nothing:
 * during the first lessons every other combination fizzles, so a new player cannot brew something by accident.
 */
export const REPUTATION_LEVELS: readonly ReputationLevel[] = [
  { id: 'shabby_shack', minReputation: 0 },
  { id: 'local_haunt', minReputation: 10, unlocks: ['bog_lantern', 'dragons_hiccup', 'swamp_fire'] },
  { id: 'cozy_inn', minReputation: 25, unlocks: ['moonlight_merlot', 'honeyed_moon'] },
  { id: 'popular_pub', minReputation: 50, unlocks: ['trolls_toll', 'gym_sock_mead', 'spicy_spores'] },
  { id: 'famous_tavern', minReputation: 100, unlocks: ['troll_torch', 'dusk_sangria'] },
  { id: 'legendary_hall', minReputation: 200, unlocks: ['berserker_brew'] },
];
