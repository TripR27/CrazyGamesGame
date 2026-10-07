import { textKey } from '@/data/text-key';
import { t } from '@/i18n/index';
import { withEffectIcon } from '@/scene/effects/effect-text';
import { guideRecipe, likedCustomer, nextIngredient, vipCustomer, type GuideContext } from '@/systems/tutorial/guide';

const name = (domain: 'recipes' | 'ingredients' | 'upgrades', id: string | undefined): string =>
  id === undefined ? '' : t(textKey(domain, id, 'name'));
const upgradeName = (id: string | null): string => (id === null ? t('tutorial.any_upgrade') : name('upgrades', id));

/** The effect of the drink a customer likes: its icon and word, and what it does (only that one effect). */
function likedEffect(ctx: GuideContext): { effect: string; does: string } {
  const recipeId = likedCustomer(ctx)?.recipeId;
  const effect = ctx.knownRecipes.find((r) => r.id === recipeId)?.effect;
  if (effect === undefined) return { effect: '', does: '' };
  return { effect: withEffectIcon(effect, t(`effects.${effect}.short`)), does: t(`effects.${effect}.does`) };
}

/** Words the mascot can use in its lines: the drink, ingredient and upgrade the guide is talking about, and the liked and VIP drinks. */
export function speech(stepId: string, ctx: GuideContext): string {
  return t(textKey('tutorial', stepId, 'text'), {
    drink: name('recipes', guideRecipe(ctx)?.id),
    ingredient: name('ingredients', nextIngredient(ctx)),
    upgrade: upgradeName(ctx.affordableUpgradeId),
    staff: upgradeName(ctx.affordableStaffId),
    liked: name('recipes', likedCustomer(ctx)?.recipeId),
    royal: name('recipes', vipCustomer(ctx)?.recipeId),
    room: ctx.affordableRoomId === null ? '' : t(textKey('rooms', ctx.affordableRoomId, 'name')),
    shopIngredient: name('ingredients', ctx.affordableIngredientId ?? ctx.newestIngredientId ?? undefined),
    ...likedEffect(ctx),
  });
}
