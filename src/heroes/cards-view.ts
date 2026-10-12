import type { World } from '@/app/world';
import { createEl, domBounds } from '@/app/panels-view';
import { type CardOption, cardOptions, currentCard, decideCard, drinkToGive, TRIP_CARDS } from '@/heroes/trip-cards';
import { t } from '@/i18n/translator';
import { textKey } from '@/shared/content';
import type { Expedition } from '@/shared/state';
import './heroes.css';

const REFRESH_MS = 200;

/** The text on an option button; an option that hands over a drink names it. */
function optionLabel(world: World, cardId: string, option: CardOption, trip: Expedition): string {
  const given = option.needsDrink === true ? drinkToGive(world.content.recipes, trip, option) : undefined;
  return t(`cards.${cardId}.${option.id}`, { drink: given === undefined ? '' : t(textKey('recipes', given, 'name')) });
}

/**
 * A choice card in the corner of the game while a hero on a trip meets something: a title, a line, one button per
 * option and a bar that runs out. It never blocks the game; when the bar is empty the safe option is taken. Each button
 * is a tutorial target (`card-option:<option id>`). Returns an unmount function.
 */
export function mountTripCards(root: HTMLElement, world: World): () => void {
  const box = createEl('div', 'trip-card');
  const title = createEl('strong', 'trip-card-title');
  const text = createEl('p', 'trip-card-text');
  const buttons = createEl('div', 'trip-card-options');
  const bar = createEl('div', 'trip-card-bar');
  const fill = createEl('div', 'trip-card-fill');
  bar.append(fill);
  box.append(title, text, buttons, bar);
  box.hidden = true;
  root.append(box);
  let shown = '';
  const removers: Array<() => void> = [];

  const render = (): void => {
    const now = world.clock.now();
    const open = currentCard(world.store.getState(), now);
    box.hidden = open === undefined;
    if (open === undefined) return;
    const { heroId, trip, card } = open;
    fill.style.width = `${Math.max(0, Math.min(1, (card.at + TRIP_CARDS.timeoutMs - now) / TRIP_CARDS.timeoutMs)) * 100}%`;
    const key = `${heroId}:${card.at}:${trip.drinks.join(',')}`;
    if (key === shown) return;
    shown = key;
    title.textContent = t('cards.title', { hero: t(textKey('heroes', heroId, 'name')), title: t(`cards.${card.id}.title`) });
    text.textContent = t(`cards.${card.id}.text`);
    removers.splice(0).forEach((remove) => remove());
    buttons.replaceChildren(
      ...cardOptions(trip, card).map((option) => {
        const button = createEl('button', option.default === true ? 'trip-card-option trip-card-option--safe' : 'trip-card-option', optionLabel(world, card.id, option, trip));
        button.addEventListener('click', () => decideCard(world, heroId, option.id));
        removers.push(world.targets.register(`card-option:${option.id}`, () => (box.hidden ? null : domBounds(button, root))));
        return button;
      }),
    );
  };
  const timer = window.setInterval(render, REFRESH_MS);
  const stops = [world.bus.on('card:opened', render), world.bus.on('card:resolved', render)];
  return () => {
    window.clearInterval(timer);
    stops.forEach((stop) => stop());
    removers.forEach((remove) => remove());
    box.remove();
  };
}
