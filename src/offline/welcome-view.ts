import type { World } from '@/app/world';
import { createEl } from '@/app/panels-view';
import { t } from '@/i18n/translator';
import { type OfflineReport, payOfflineAgain } from '@/offline/offline';
import { toWelcomeView } from '@/offline/welcome-model';
import type { Ads } from '@/platform/platform';
import './welcome.css';

/**
 * The "welcome back" window: shown when a report arrives (or was already waiting), closed with one button. When the staff
 * earned something, a rewarded ad can double it (the player chooses; no ad, no reward).
 */
export function mountWelcomeBack(root: HTMLElement, world: World, ads: Pick<Ads, 'rewarded' | 'available' | 'rules'>): () => void {
  const backdrop = createEl('div', 'welcome');
  backdrop.hidden = true;
  const card = createEl('div', 'welcome-card');
  const title = createEl('h2', 'welcome-title');
  const lines = createEl('div', 'welcome-lines');
  const double = createEl('button', 'welcome-button welcome-double', t('welcome.double'));
  const button = createEl('button', 'welcome-button');
  const buttons = createEl('div', 'welcome-buttons');
  buttons.append(button, double);
  card.append(title, lines, buttons);
  backdrop.append(card);
  root.append(backdrop);
  let report: OfflineReport | null = null;
  button.addEventListener('click', () => void (backdrop.hidden = true));
  double.addEventListener('click', () => {
    const shown = report;
    double.disabled = true;
    ads.rewarded(
      () => {
        if (shown !== null) payOfflineAgain(world, shown);
        double.textContent = t('welcome.doubled');
      },
      // No ad this time: say so and let the player try again; no ads at all in this session: say why (CrazyGames), or
      // just take the offer away (Poki shows its own ad-blocker message).
      (unavailable) => {
        if (unavailable && !ads.rules.explainOff) return void (double.hidden = true);
        double.textContent = t(unavailable ? 'welcome.ads_off' : 'welcome.no_ad');
        double.disabled = unavailable;
      },
    );
  });

  const show = (next: OfflineReport): void => {
    report = next;
    const view = toWelcomeView(next);
    title.textContent = view.title;
    button.textContent = view.button;
    lines.replaceChildren(...view.lines.map((line) => createEl('p', 'welcome-line', line)));
    double.hidden = next.served === 0 || !ads.available();
    card.classList.toggle('welcome-card--offer', !double.hidden);
    double.disabled = false;
    double.textContent = t('welcome.double');
    backdrop.hidden = false;
  };
  const inbox = world.offline.inbox;
  const waiting = inbox.take();
  if (waiting !== null) show(waiting);
  const unsubscribe = inbox.subscribe(show);

  return () => {
    unsubscribe();
    backdrop.remove();
  };
}
