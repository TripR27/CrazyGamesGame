import type { World } from '@/app/world';
import { createEl, domBounds } from '@/app/panels-view';
import { DAILY, claimDaily, dailyOffer } from '@/daily/daily';
import { t } from '@/i18n/translator';
import { formatNumber } from '@/shared/numbers';
import './daily.css';

const REFRESH_MS = 1000;
/** How long the thank-you line stays after claiming. */
const THANKS_MS = 3000;

/**
 * The daily bonus: a small card under the HUD with today's gold and a Claim button, while it can be claimed. It waits
 * while another lesson of the tutorial is on screen, so it never gets in the way of one. The button is the tutorial
 * target `daily-claim`. Returns an unmount function.
 */
export function mountDailyBonus(root: HTMLElement, world: World): () => void {
  const { store, bus, clock, tutorial, targets } = world;
  const card = createEl('div', 'daily');
  const title = createEl('strong', 'daily-title', t('daily.title'));
  const line = createEl('p', 'daily-line');
  const claim = createEl('button', 'daily-claim', t('daily.claim'));
  card.append(title, line, claim);
  card.hidden = true;
  root.append(card);
  let thanksUntil = 0;

  const render = (): void => {
    const now = clock.now();
    if (now < thanksUntil) return;
    const offer = dailyOffer(store.getState(), now);
    const lesson = tutorial.machine.visibleStep()?.lesson;
    card.hidden = !offer.available || (lesson !== undefined && lesson !== 'daily');
    claim.hidden = false;
    line.textContent = t('daily.offer', { day: offer.day, days: DAILY.streakFactors.length, gold: formatNumber(offer.gold) });
  };
  claim.addEventListener('click', () => claimDaily(world));
  const stopClaimed = bus.on('daily:claimed', ({ day }) => {
    line.textContent = t('daily.thanks', { next: Math.min(day + 1, DAILY.streakFactors.length) });
    claim.hidden = true;
    thanksUntil = clock.now() + THANKS_MS;
  });
  const stopTarget = targets.register('daily-claim', () => (card.hidden || claim.hidden ? null : domBounds(claim, root)));
  const timer = window.setInterval(render, REFRESH_MS);
  render();
  return () => {
    window.clearInterval(timer);
    stopClaimed();
    stopTarget();
    card.remove();
  };
}
