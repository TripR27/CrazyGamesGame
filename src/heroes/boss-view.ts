import type { World } from '@/app/world';
import { createEl, domBounds } from '@/app/panels-view';
import { BOSSES, bossBar, type BossBar, currentBoss, STRIKES, strikeBoss } from '@/heroes/boss-fight';
import { t } from '@/i18n/translator';
import { textKey } from '@/shared/content';
import './heroes.css';

const REFRESH_MS = 200;
/** How long the outcome of a finished fight stays on screen. */
const RESULT_MS = 2500;

const bossName = (dungeon: string): string => t(textKey('bosses', BOSSES[dungeon]?.id ?? '', 'name'));

/** The parts of the fight box. */
function createBox(root: HTMLElement): { box: HTMLElement; title: HTMLElement; text: HTMLElement; bar: HTMLElement; zone: HTMLElement; pointer: HTMLElement; marks: HTMLElement; strike: HTMLButtonElement } {
  const box = createEl('div', 'boss-fight');
  const title = createEl('strong', 'boss-title');
  const text = createEl('p', 'boss-text', t('boss.text'));
  const bar = createEl('div', 'boss-bar');
  const zone = createEl('div', 'boss-zone');
  const pointer = createEl('div', 'boss-pointer');
  bar.append(zone, pointer);
  const marks = createEl('div', 'boss-marks');
  const strike = createEl('button', 'boss-strike', t('boss.strike'));
  box.append(title, text, bar, marks, strike);
  box.hidden = true;
  root.append(box);
  return { box, title, text, bar, zone, pointer, marks, strike };
}

/** One mark per strike: a hit, a miss, or still to come. */
function marksText(hits: readonly boolean[]): string {
  let line = '';
  for (let i = 0; i < STRIKES; i++) line += i < hits.length ? (hits[i] === true ? '💥' : '✖') : '○';
  return line;
}

/**
 * Moves the pointer and the green zone every frame while a fight is on screen (no new objects per frame); it stops by
 * itself once no fight is open.
 */
function animateBar(world: World, ui: { zone: HTMLElement; pointer: HTMLElement }): { start(): void; stop(): void } {
  let frame = 0;
  const shape: BossBar = { pointer: 0, zone: 0 };
  const animate = (): void => {
    frame = 0;
    const now = world.clock.now();
    const open = currentBoss(world.store.getState(), now);
    const hero = open === undefined ? undefined : world.store.getState().heroes[open.heroId];
    if (open === undefined || hero === undefined) return;
    bossBar(world.content.recipes, open.heroId, hero, open.trip, now, shape);
    ui.pointer.style.left = `${shape.pointer * 100}%`;
    ui.zone.style.left = `${(0.5 - shape.zone / 2) * 100}%`;
    ui.zone.style.width = `${shape.zone * 100}%`;
    frame = window.requestAnimationFrame(animate);
  };
  return {
    start: () => {
      if (frame === 0) frame = window.requestAnimationFrame(animate);
    },
    stop: () => window.cancelAnimationFrame(frame),
  };
}

/**
 * The boss fight in the game while a hero's trip nears its end: a timing bar with a pointer that swings and a green zone.
 * Strike (the button or the bar; mouse and touch) when the pointer is in the green, three times. It never blocks the
 * game; a player who does not fight gets the default outcome. The button is the tutorial target `boss-strike`.
 */
export function mountBossFight(root: HTMLElement, world: World): () => void {
  const ui = createBox(root);
  let heroId: string | null = null;
  let resultUntil = 0;
  const animation = animateBar(world, ui);
  const hit = (): void => {
    if (heroId !== null) strikeBoss(world, heroId);
  };
  ui.strike.addEventListener('pointerdown', hit);
  ui.bar.addEventListener('pointerdown', hit);
  const stopTarget = world.targets.register('boss-strike', () => (ui.box.hidden || heroId === null ? null : domBounds(ui.strike, root)));

  const render = (): void => {
    const now = world.clock.now();
    const open = currentBoss(world.store.getState(), now);
    if (open === undefined) {
      heroId = null;
      ui.box.hidden = now >= resultUntil;
      return;
    }
    ui.box.hidden = false;
    ui.strike.disabled = false;
    if (open.heroId !== heroId) {
      heroId = open.heroId;
      ui.title.textContent = t('boss.title', { hero: t(textKey('heroes', open.heroId, 'name')), boss: bossName(open.trip.dungeon) });
      ui.text.textContent = t('boss.text');
    }
    ui.marks.textContent = marksText(open.trip.boss?.hits ?? []);
    animation.start();
  };

  /** A finished fight: the marks and the outcome stay a moment. */
  const showResult = ({ heroId: id, result }: { heroId: string; result: 'won' | 'lost' | null }): void => {
    const trip = world.store.getState().heroes[id]?.expedition;
    // Only a fight finished on screen; one cut short by the hero's return just goes away.
    if (result === null || trip?.boss === undefined) return;
    ui.marks.textContent = marksText(trip.boss.hits);
    ui.text.textContent = t(result === 'won' ? 'boss.won' : 'boss.lost', { boss: bossName(trip.dungeon) });
    ui.strike.disabled = true;
    ui.box.hidden = false;
    resultUntil = world.clock.now() + RESULT_MS;
    heroId = null;
  };

  const timer = window.setInterval(render, REFRESH_MS);
  const stops = [world.bus.on('boss:opened', render), world.bus.on('boss:struck', render), world.bus.on('boss:resolved', showResult)];
  return () => {
    window.clearInterval(timer);
    animation.stop();
    stops.forEach((stop) => stop());
    stopTarget();
    ui.box.remove();
  };
}
