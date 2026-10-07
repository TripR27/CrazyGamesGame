import { t } from '@/i18n/index';
import { effectIcon } from '@/scene/effects/effect-text';
import { type Effect, textKey } from '@/shared/content';

/**
 * The text in a customer's order bubble: the drink with the icon of its effect, a ♥ when they like that effect
 * (it counts double) and a crown for a VIP.
 */
export function orderLabel(customer: { recipeId: string; liked: boolean; vip: boolean }, effect: Effect): string {
  const params = { drink: t(textKey('recipes', customer.recipeId, 'name')), icon: effectIcon(effect) };
  const order = t(customer.liked ? 'effects.liked_order' : 'effects.order', params);
  return customer.vip ? t('customers.vip_order', { order }) : order;
}
