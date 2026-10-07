import { ingredients as allIngredients, type IngredientDef } from '@/brewing/ingredients';
import type { CustomerDef } from '@/customers/customer-data';
import { t } from '@/i18n/translator';
import type { RecipeId } from '@/recipes/recipe-data';
import { textKey } from '@/shared/content';
import type { EventBus, GameEvents } from '@/shared/events';

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
  { id: 'cozy_inn', minReputation: 40, unlocks: ['moonlight_merlot', 'honeyed_moon'] },
  { id: 'popular_pub', minReputation: 120, unlocks: ['trolls_toll', 'gym_sock_mead', 'spicy_spores'] },
  { id: 'famous_tavern', minReputation: 300, unlocks: ['troll_torch', 'dusk_sangria'] },
  { id: 'legendary_hall', minReputation: 650, unlocks: ['berserker_brew'] },
];

/** The level for this much reputation: 1 is the first level. Levels are passed in so tests can use their own. */
export function levelFor(reputation: number, levels: readonly ReputationLevel[] = REPUTATION_LEVELS): number {
  return Math.max(1, levels.filter((l) => l.minReputation <= reputation).length);
}

export interface LevelProgress {
  level: number;
  current: ReputationLevel;
  /** Undefined at the top level. */
  next: ReputationLevel | undefined;
  /** How far towards the next level, 0 to 1 (1 at the top level). */
  fraction: number;
}

/** Where the player stands: the level, the next one and how far along the way (for the HUD). */
export function levelProgress(reputation: number, levels: readonly ReputationLevel[] = REPUTATION_LEVELS): LevelProgress {
  const level = levelFor(reputation, levels);
  const current = levels[level - 1] ?? { id: '', minReputation: 0 };
  const next = levels[level];
  const span = next === undefined ? 0 : next.minReputation - current.minReputation;
  const fraction = span <= 0 ? 1 : Math.min(1, (reputation - current.minReputation) / span);
  return { level, current, next, fraction };
}

/** Every recipe the levels up to and including `level` unlock for discovery, in level order. */
export function recipesUnlockedUpTo(level: number, levels: readonly ReputationLevel[] = REPUTATION_LEVELS): string[] {
  return levels.slice(0, level).flatMap((l) => l.unlocks ?? []);
}

/** The part of the state levels look at (interface segregation: not the whole state). */
export interface LevelState {
  reputation: number;
}

export interface LevelStore {
  getState(): LevelState;
  subscribe(listener: (state: LevelState) => void): () => void;
}

/**
 * Follows the reputation and announces every new level once (`reputation:levelUp`), also after a big jump.
 * What a level opens up (customers, recipes to discover) is read from the level data itself, so nothing is
 * copied into the state here.
 */
export function watchReputationLevels(store: LevelStore, bus: EventBus<GameEvents>): () => void {
  let level = levelFor(store.getState().reputation);
  return store.subscribe((state) => {
    const now = levelFor(state.reputation);
    if (now <= level) return;
    const from = level;
    level = now;
    for (let reached = from + 1; reached <= now; reached++) bus.emit('reputation:levelUp', { level: reached });
    bus.emit('saveRequested', {});
  });
}

export interface LevelUpView {
  title: string;
  /** What the new level brings: new customers, new ingredients in the shop and new recipes. Empty when nothing new. */
  lines: string[];
}

/** The message for reaching `level` (1 is the first), as plain strings. */
export function toLevelUpView(
  level: number,
  customerTypes: readonly CustomerDef[],
  levels: readonly ReputationLevel[] = REPUTATION_LEVELS,
  ingredients: readonly IngredientDef[] = allIngredients,
): LevelUpView {
  const reached = levels[level - 1];
  if (reached === undefined) return { title: '', lines: [] };
  const name = (id: string): string => t(textKey('customers', id, 'name'));
  return {
    title: t('reputation.level_up', { level: t(textKey('reputation', reached.id, 'name')) }),
    lines: [
      ...customerTypes
        .filter((c) => c.minLevel === level)
        .map((c) => t('reputation.new_customer', { name: name(c.id) })),
      ...ingredients
        .filter((i) => i.buy?.level === level)
        .map((i) => t('reputation.new_ingredient', { name: t(textKey('ingredients', i.id, 'name')) })),
      // Recipe names stay secret: they still have to be discovered.
      ...((reached.unlocks ?? []).length > 0 ? [t('reputation.new_recipes', { n: reached.unlocks?.length ?? 0 })] : []),
    ],
  };
}
