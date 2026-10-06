import { textKey } from '@/data/text-key';
import { t } from '@/i18n';

/**
 * The text in a customer's order bubble: the drink, with a ♥ when they like its effect (it counts double)
 * and a crown for a VIP.
 */
export function orderLabel(customer: { recipeId: string; liked: boolean; vip: boolean }): string {
  const drink = t(textKey('recipes', customer.recipeId, 'name'));
  const order = customer.liked ? t('effects.liked_order', { drink }) : drink;
  return customer.vip ? t('customers.vip_order', { order }) : order;
}
