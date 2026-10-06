import { t } from '@/i18n';
import { sidePanelWidth, type SideLayout } from '@/ui/side-layout';

/**
 * The Shop button opens and closes the side panel and tells the layout how much room it takes,
 * so the game view shrinks next to it. Returns a stop function.
 */
export function bindPanelToggle(
  button: HTMLElement,
  panel: HTMLElement,
  layout: SideLayout,
  onOpen: () => void,
): () => void {
  const fit = (): void => {
    const width = panel.hidden ? 0 : sidePanelWidth(window.innerWidth);
    panel.style.width = `${width}px`;
    layout.setWidth(width);
  };
  button.addEventListener('click', () => {
    panel.hidden = !panel.hidden;
    button.textContent = t(panel.hidden ? 'shop.button' : 'shop.close');
    fit();
    if (!panel.hidden) onOpen();
  });
  window.addEventListener('resize', fit);
  return () => window.removeEventListener('resize', fit);
}
