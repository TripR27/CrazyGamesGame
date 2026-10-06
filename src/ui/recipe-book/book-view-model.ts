import { formatNumber } from '@/core/format';
import { num } from '@/core/numbers';
import type { GameState } from '@/core/state';
import type { RecipeDef } from '@/data/recipes';
import { REPUTATION_LEVELS, type ReputationLevel } from '@/data/reputation/levels';
import { textKey } from '@/data/text-key';
import { effectName } from '@/scene/effects/effect-text';
import { t } from '@/i18n';
import { levelFor } from '@/systems/reputation';

/** What the book needs from the state (interface segregation). */
export type BookState = Pick<GameState, 'recipesDiscovered' | 'reputation'>;

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
  | { kind: 'hidden'; id: string; hint: string; rarity: string }
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

/** Every recipe as the book shows it, in content order, with the X/N progress on top. */
export function toBookView(
  state: BookState,
  recipes: readonly RecipeDef[],
  levels: readonly ReputationLevel[] = REPUTATION_LEVELS,
): BookView {
  const level = levelFor(state.reputation, levels);
  const unlockIndex = (id: string): number => levels.findIndex((l) => (l.unlocks ?? []).includes(id));
  const entries = recipes.map((r): BookEntry => {
    if (state.recipesDiscovered.includes(r.id)) return knownEntry(r);
    const at = unlockIndex(r.id);
    if (at !== -1 && at < level) return { kind: 'hidden', id: r.id, hint: text('recipes', r.id, 'hint'), rarity: r.rarity };
    const name = at === -1 ? t('book.unknown') : text('reputation', levels[at]?.id ?? '', 'name');
    return { kind: 'locked', id: r.id, unlock: t('book.locked', { level: name }) };
  });
  const found = recipes.filter((r) => state.recipesDiscovered.includes(r.id)).length;
  return { progress: t('book.progress', { found, total: recipes.length }), entries };
}
