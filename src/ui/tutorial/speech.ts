import { textKey } from '@/data/text-key';
import { t } from '@/i18n';
import { guideRecipe, likedCustomer, nextIngredient, vipCustomer, type GuideContext } from '@/systems/tutorial';

const name = (domain: 'recipes' | 'ingredients' | 'upgrades', id: string | undefined): string =>
  id === undefined ? '' : t(textKey(domain, id, 'name'));

/** Words the mascot can use in its lines: the drink, ingredient and upgrade the guide is talking about, and the liked and VIP drinks. */
export function speech(stepId: string, ctx: GuideContext): string {
  return t(textKey('tutorial', stepId, 'text'), {
    drink: name('recipes', guideRecipe(ctx)?.id),
    ingredient: name('ingredients', nextIngredient(ctx)),
    upgrade: name('upgrades', ctx.affordableUpgradeId ?? undefined),
    staff: name('upgrades', ctx.affordableStaffId ?? undefined),
    liked: name('recipes', likedCustomer(ctx)?.recipeId),
    royal: name('recipes', vipCustomer(ctx)?.recipeId),
  });
}
