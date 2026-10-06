import { t } from '@/i18n';
import { SHOP_PANEL_WIDTH, type SideLayout } from '@/ui/side-layout';

/**
 * The Shop button opens and closes the side panel and tells the layout how much room it takes,
 * so the game view shrinks next to it.
 */
export function bindPanelToggle(
  button: HTMLElement,
  panel: HTMLElement,
  layout: SideLayout,
  { onOpen, onClose }: { onOpen: () => void; onClose: () => void },
): void {
  button.addEventListener('click', () => {
    panel.hidden = !panel.hidden;
    button.textContent = t(panel.hidden ? 'shop.button' : 'shop.close');
    layout.setWidth(panel.hidden ? 0 : SHOP_PANEL_WIDTH);
    if (panel.hidden) onClose();
    else onOpen();
  });
}
