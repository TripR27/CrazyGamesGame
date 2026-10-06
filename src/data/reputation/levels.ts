import type { RecipeId } from '@/data/recipes/types';

/**
 * A reputation level. The name is the i18n text `reputation.<id>.name`. Customer types open up by level
 * (`minLevel`), and a level can teach recipes. Until step 12 that means the player simply knows them;
 * from step 12 on it will mean they can be discovered. Rooms (step 14) will use the level too.
 */
export interface ReputationLevel {
  id: string;
  /** Reputation needed to reach this level; the first level starts at 0. */
  minReputation: number;
  teaches?: readonly RecipeId[];
}

/** In order, from the first level up. Placeholder thresholds; tuned in step 13. */
export const REPUTATION_LEVELS: readonly ReputationLevel[] = [
  { id: 'shabby_shack', minReputation: 0 },
  { id: 'local_haunt', minReputation: 10 },
  { id: 'cozy_inn', minReputation: 25, teaches: ['dragons_hiccup'] },
  { id: 'popular_pub', minReputation: 50, teaches: ['moonlight_merlot'] },
  { id: 'famous_tavern', minReputation: 100, teaches: ['trolls_toll'] },
  { id: 'legendary_hall', minReputation: 200 },
];
