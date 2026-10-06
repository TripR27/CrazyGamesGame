import type { EventBus } from '@/core/events';
import type { GameEvents } from '@/core/game-events';

/** Which open/close events belong to which side-panel tab. A new tab is one more entry. */
const TAB_EVENTS = [
  { tab: 'shop', opened: 'shop:opened', closed: 'shop:closed' },
  { tab: 'recipes', opened: 'book:opened', closed: 'book:closed' },
] as const;

/**
 * Follows the side panel from the events its tabs announce, so the tutorial knows whether to point at the button
 * that unfolds the panel, at a tab, or inside it. Returns a getter: the tab on screen, or null while folded away.
 */
export function followOpenTab(bus: EventBus<GameEvents>): () => string | null {
  let open: string | null = null;
  for (const { tab, opened, closed } of TAB_EVENTS) {
    bus.on(opened, () => void (open = tab));
    bus.on(closed, () => void (open = open === tab ? null : open));
  }
  return () => open;
}
