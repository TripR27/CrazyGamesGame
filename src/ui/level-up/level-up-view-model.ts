import type { CustomerDef } from '@/data/customers';
import { ingredients as allIngredients, type IngredientDef } from '@/data/ingredients';
import { REPUTATION_LEVELS, type ReputationLevel } from '@/data/reputation/levels';
import { textKey } from '@/data/text-key';
import { t } from '@/i18n';

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
