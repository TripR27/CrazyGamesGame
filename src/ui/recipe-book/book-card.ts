import { t } from '@/i18n';
import { ingredientColor } from '@/scene/brewing/ingredient-look';
import { createEl } from '@/ui/dom';
import type { BookEntry } from './book-view-model';

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
