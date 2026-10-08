import type { World } from '@/app/world';
import { createEl, domBounds, type SidePanels } from '@/app/panels-view';
import { HERO_CLASSES, hireHeroById, sendHero } from '@/heroes/heroes';
import { type HeroCardView, toHeroesView } from '@/heroes/heroes-model';
import { t } from '@/i18n/translator';
import './heroes.css';

/** While the tab is on screen the countdowns tick; this often is enough for a "1:05" clock. */
const REFRESH_MS = 250;

const setText = (el: HTMLElement, text: string): void => {
  if (el.textContent !== text) el.textContent = text;
};

interface Card {
  el: HTMLElement;
  button: HTMLButtonElement;
  kind: HeroCardView['action']['kind'];
  update(view: HeroCardView): void;
}

/** One hero's card: name, tagline, level with an XP bar, where they are, and a button. Only text and flags change. */
function createCard(onAction: (card: Card) => void): Card {
  const el = createEl('div', 'hero-card');
  const title = createEl('strong', 'hero-title');
  const level = createEl('span', 'hero-level');
  const head = createEl('div', 'hero-head');
  head.append(title, level);
  const tagline = createEl('p', 'hero-tagline');
  const bar = createEl('div', 'hero-xp-bar');
  const fill = createEl('div', 'hero-xp-fill');
  const xp = createEl('span', 'hero-xp');
  bar.append(fill, xp);
  const status = createEl('p', 'hero-status');
  const button = createEl('button', 'hero-button');
  el.append(head, tagline, bar, status, button);
  const card: Card = {
    el,
    button,
    kind: 'none',
    update(view) {
      card.kind = view.action.kind;
      setText(title, view.title);
      setText(level, view.level);
      setText(tagline, view.tagline);
      setText(xp, view.xp);
      bar.hidden = view.level === '';
      fill.style.width = `${Math.round(view.xpFraction * 100)}%`;
      setText(status, view.status);
      setText(button, view.action.label);
      button.disabled = !view.action.enabled;
    },
  };
  button.addEventListener('click', () => onAction(card));
  return card;
}

function buildPanel() {
  const panel = createEl('div', 'heroes-panel');
  const noGuild = createEl('p', 'heroes-no-guild');
  const stockTitle = createEl('h3', 'heroes-stock-title');
  const stock = createEl('ul', 'heroes-stock');
  const list = createEl('div', 'heroes-list');
  panel.append(createEl('h2', 'heroes-title', t('heroes.title')), noGuild, stockTitle, stock, list);
  return { panel, noGuild, stockTitle, stock, list };
}

/**
 * The Heroes tab of the side panel: the dungeon loot held, then a card per hero to send them to the swamp or hire them.
 * Each card's button is a tutorial target (`hero-send:<id>`, `hero-hire:<id>`). Returns an unmount function.
 */
export function mountHeroes({ root, panels }: { root: HTMLElement; panels: SidePanels }, world: World): () => void {
  const { store, targets, clock } = world;
  const { panel, noGuild, stockTitle, stock, list } = buildPanel();
  const cards = HERO_CLASSES.map((def) => {
    const card = createCard((c) => (c.kind === 'hire' ? hireHeroById(world, def.id) : sendHero(world, def.id)));
    list.append(card.el);
    const showing = (kind: string) => () => (panel.hidden || card.el.hidden || card.kind !== kind ? null : domBounds(card.button, root));
    const reveal = (): void => card.button.scrollIntoView({ block: 'nearest' });
    const removers = [targets.register(`hero-send:${def.id}`, showing('send'), reveal), targets.register(`hero-hire:${def.id}`, showing('hire'), reveal)];
    return { def, card, removers };
  });

  let shownStock = '';
  const render = (): void => {
    if (panel.hidden) return;
    const view = toHeroesView(store.getState(), clock.now());
    noGuild.hidden = view.noGuild === null;
    setText(noGuild, view.noGuild ?? '');
    setText(stockTitle, view.stockTitle);
    stockTitle.hidden = view.stock.length === 0;
    if (view.stock.join('|') !== shownStock) {
      shownStock = view.stock.join('|');
      stock.replaceChildren(...view.stock.map((line) => createEl('li', 'heroes-stock-item', line)));
    }
    for (const { def, card } of cards) {
      const cardView = view.cards.find((c) => c.id === def.id);
      card.el.hidden = cardView === undefined;
      if (cardView !== undefined) card.update(cardView);
    }
  };

  let timer: number | undefined;
  panels.add({
    id: 'heroes',
    labelKey: 'heroes.tab',
    content: panel,
    onOpen: () => {
      render();
      timer = window.setInterval(render, REFRESH_MS);
      world.bus.emit('heroes:opened', {});
    },
    onClose: () => {
      window.clearInterval(timer);
      world.bus.emit('heroes:closed', {});
    },
  });
  const unsubscribe = store.subscribe(render);
  return () => {
    unsubscribe();
    window.clearInterval(timer);
    cards.forEach(({ removers }) => removers.forEach((remove) => remove()));
    panel.remove();
  };
}
