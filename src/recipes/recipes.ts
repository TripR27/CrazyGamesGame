import { ingredients as allIngredients, type IngredientDef, ownedIngredients } from '@/brewing/ingredients';
import { t } from '@/i18n/translator';
import type { RecipeDef } from '@/recipes/recipe-data';
import { levelFor, recipesUnlockedUpTo, REPUTATION_LEVELS, type ReputationLevel } from '@/reputation/reputation';
import { effectName } from '@/serving/effects';
import { textKey } from '@/shared/content';
import type { EventBus, GameEvents } from '@/shared/events';
import { formatNumber, num } from '@/shared/numbers';
import type { GameState } from '@/shared/state';

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

/** What the book needs from the state (interface segregation). */
export type BookState = Pick<GameState, 'recipesDiscovered' | 'reputation' | 'ingredientsBought'>;

/** A known recipe shows how to make it; a discoverable one a silhouette with a hint; a locked one its level. */
export type BookEntry =
  | {
      kind: 'known';
      id: string;
      name: string;
      ingredients: { id: string; name: string }[];
      details: string[];
      rarity: string;
    }
  /** `needs`: the shop ingredients still to buy before it can be discovered, or undefined when none are missing. */
  | { kind: 'hidden'; id: string; hint: string; rarity: string; needs?: string }
  | { kind: 'locked'; id: string; unlock: string };

export interface BookView {
  progress: string;
  entries: BookEntry[];
}

const text = (domain: 'recipes' | 'ingredients' | 'reputation', id: string, field: string): string =>
  t(textKey(domain, id, field));

function knownEntry(r: RecipeDef): BookEntry {
  return {
    kind: 'known',
    id: r.id,
    name: text('recipes', r.id, 'name'),
    ingredients: r.ingredients.map((id) => ({ id, name: text('ingredients', id, 'name') })),
    details: [
      t('book.brew_time', { s: r.brewSeconds }),
      t('book.price', { n: formatNumber(num(r.basePrice)) }),
      effectName(r.effect),
    ],
    rarity: r.rarity,
  };
}

/** "Needs Fire Pepper from the shop" for a recipe whose ingredients are not all on the shelf yet. */
function needsLine(r: RecipeDef, owned: readonly string[]): string | undefined {
  const missing = r.ingredients.filter((id) => !owned.includes(id)).map((id) => text('ingredients', id, 'name'));
  return missing.length === 0 ? undefined : t('book.needs', { ingredients: missing.join(', ') });
}

/** Every recipe as the book shows it, in content order, with the X/N progress on top. */
export function toBookView(
  state: BookState,
  recipes: readonly RecipeDef[],
  levels: readonly ReputationLevel[] = REPUTATION_LEVELS,
  ingredients: readonly IngredientDef[] = allIngredients,
): BookView {
  const level = levelFor(state.reputation, levels);
  const owned = ownedIngredients(state, ingredients, recipes).map((i) => i.id);
  const unlockIndex = (id: string): number => levels.findIndex((l) => (l.unlocks ?? []).includes(id));
  const entries = recipes.map((r): BookEntry => {
    if (state.recipesDiscovered.includes(r.id)) return knownEntry(r);
    const at = unlockIndex(r.id);
    if (at !== -1 && at < level) {
      const needs = needsLine(r, owned);
      return { kind: 'hidden', id: r.id, hint: text('recipes', r.id, 'hint'), rarity: r.rarity, ...(needs === undefined ? {} : { needs }) };
    }
    const name = at === -1 ? t('book.unknown') : text('reputation', levels[at]?.id ?? '', 'name');
    return { kind: 'locked', id: r.id, unlock: t('book.locked', { level: name }) };
  });
  const found = recipes.filter((r) => state.recipesDiscovered.includes(r.id)).length;
  return { progress: t('book.progress', { found, total: recipes.length }), entries };
}
