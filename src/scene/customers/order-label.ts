import type { Effect } from '@/data/common';
import { textKey } from '@/data/text-key';
import { t } from '@/i18n';
import { effectIcon } from '@/scene/effects/effect-text';

/**
 * The text in a customer's order bubble: the drink with the icon of its effect, a ♥ when they like that effect
 * (it counts double) and a crown for a VIP.
 */
export function orderLabel(customer: { recipeId: string; liked: boolean; vip: boolean }, effect: Effect): string {
  const params = { drink: t(textKey('recipes', customer.recipeId, 'name')), icon: effectIcon(effect) };
  const order = t(customer.liked ? 'effects.liked_order' : 'effects.order', params);
  return customer.vip ? t('customers.vip_order', { order }) : order;
}
