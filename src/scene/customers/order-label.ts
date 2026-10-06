import { textKey } from '@/data/text-key';
import { t } from '@/i18n';

/** The text in a customer's order bubble: the drink, with a ♥ when they like its effect (it counts double). */
export function orderLabel(customer: { recipeId: string; liked: boolean }): string {
  const drink = t(textKey('recipes', customer.recipeId, 'name'));
  return customer.liked ? t('effects.liked_order', { drink }) : drink;
}
