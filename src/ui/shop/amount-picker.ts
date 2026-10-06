import { t } from '@/i18n';
import type { BuyAmount } from '@/systems/upgrades';
import { createEl } from '@/ui/dom';

const AMOUNTS: readonly BuyAmount[] = [1, 10, 'max'];

export function createAmountPicker(onPick: (amount: BuyAmount) => void): { el: HTMLElement; select(a: BuyAmount): void } {
  const el = createEl('div', 'shop-amounts');
  const buttons = AMOUNTS.map((amount) => {
    const button = createEl('button', 'shop-amount', t(`shop.amount_${amount}`));
    button.addEventListener('click', () => onPick(amount));
    el.append(button);
    return { amount, button };
  });
  return {
    el,
    select: (picked) => buttons.forEach(({ amount, button }) => button.classList.toggle('shop-amount--on', amount === picked)),
  };
}
