import type { PlayerActions } from '@/app/actions';
import { ingredientColor } from '@/brewing/brewing-view';
import { t } from '@/i18n/index';
import { recipes } from '@/recipes/recipe-data';
import { type BookEntry, toBookView, type BookState } from '@/recipes/recipes';
import type { Listener } from '@/shared/state';
import type { TargetRegistry } from '@/shared/targets';
import { createEl } from '@/ui/dom';
import { domBounds } from '@/ui/dom-bounds';
import type { SidePanels } from '@/ui/side-panels';
import './recipe-book.css';

const cssColor = (id: string): string => `#${ingredientColor(id).toString(16).padStart(6, '0')}`;

/** An ingredient as a coloured dot with its name, the same colour as on the shelf. */
function ingredientChip(ingredient: { id: string; name: string }): HTMLElement {
  const chip = createEl('span', 'book-chip');
  const dot = createEl('span', 'book-dot');
  dot.style.background = cssColor(ingredient.id);
  chip.append(dot, ingredient.name);
  return chip;
}

function rarityTag(rarity: string): HTMLElement {
  return createEl('span', `book-rarity book-rarity--${rarity}`, t(`book.rarity_${rarity}`));
}

/** One card in the book: how to make a known drink, a hint for one to discover, or the level that unlocks it. */
export function createBookCard(entry: BookEntry): HTMLElement {
  const card = createEl('div', `book-card book-card--${entry.kind}`);
  if (entry.kind === 'known') {
    const head = createEl('div', 'book-card-head');
    head.append(createEl('strong', 'book-name', entry.name), rarityTag(entry.rarity));
    const ingredients = createEl('div', 'book-ingredients');
    ingredients.append(...entry.ingredients.map(ingredientChip));
    card.append(head, ingredients, createEl('p', 'book-details', entry.details.join(' · ')));
  } else if (entry.kind === 'hidden') {
    const head = createEl('div', 'book-card-head');
    head.append(createEl('strong', 'book-name', t('book.hidden_name')), rarityTag(entry.rarity));
    card.append(head, createEl('p', 'book-hint', entry.hint));
    if (entry.needs !== undefined) card.append(createEl('p', 'book-needs', entry.needs));
  } else {
    card.append(createEl('strong', 'book-name', t('book.hidden_name')), createEl('p', 'book-hint', entry.unlock));
  }
  return card;
}

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
