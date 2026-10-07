import { recipes } from '@/data/recipes/index';
import { t } from '@/i18n/index';
import type { Listener } from '@/shared/state';
import type { TargetRegistry } from '@/shared/targets';
import type { PlayerActions } from '@/systems/actions/player-actions';
import { createEl } from '@/ui/dom';
import { domBounds } from '@/ui/dom-bounds';
import { createBookCard } from '@/ui/recipe-book/book-card';
import { toBookView, type BookState } from '@/ui/recipe-book/book-view-model';
import type { SidePanels } from '@/ui/side-panels';
import './book.css';

export interface BookSource {
  getState(): BookState;
  subscribe(listener: Listener<BookState>): () => void;
}

export interface BookHosts {
  root: HTMLElement;
  panels: SidePanels;
}

/**
 * The Recipes tab of the side panel, with every drink: how to make the ones the player knows, a hint for
 * the ones they can discover, and the level that unlocks the rest. Returns an unmount function.
 */
export function mountRecipeBook(
  { root, panels }: BookHosts,
  source: BookSource,
  actions: Pick<PlayerActions, 'openBook' | 'closeBook'>,
  targets: TargetRegistry,
): () => void {
  const panel = createEl('div', 'book-panel');
  const progress = createEl('span', 'book-progress');
  const head = createEl('div', 'book-head');
  head.append(createEl('h2', 'book-title', t('book.title')), progress);
  const grid = createEl('div', 'book-grid');
  panel.append(head, grid);

  // Rebuilt only when something the book shows changed (a discovery or a new level), not on every gold tick.
  let shown = '';
  const render = (state: BookState): void => {
    const view = toBookView(state, recipes);
    const key = JSON.stringify(view);
    if (key === shown) return;
    shown = key;
    progress.textContent = view.progress;
    grid.replaceChildren(...view.entries.map(createBookCard));
  };
  panels.add({ id: 'recipes', labelKey: 'book.tab', content: panel, onOpen: actions.openBook, onClose: actions.closeBook });
  render(source.getState());
  const unsubscribe = source.subscribe(render);
  const unregister = targets.register('book-panel', () => (panel.hidden ? null : domBounds(head, root)));

  return () => {
    unsubscribe();
    unregister();
    panel.remove();
  };
}
