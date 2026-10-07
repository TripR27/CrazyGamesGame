import { createEl } from '@/app/panels-view';
import { type OfflineInbox, toWelcomeView } from '@/offline/offline';
import './welcome.css';

/** The "welcome back" window: shown when a report arrives (or was already waiting), closed with one button. */
export function mountWelcomeBack(root: HTMLElement, inbox: OfflineInbox): () => void {
  const backdrop = createEl('div', 'welcome');
  backdrop.hidden = true;
  const card = createEl('div', 'welcome-card');
  const title = createEl('h2', 'welcome-title');
  const lines = createEl('div', 'welcome-lines');
  const button = createEl('button', 'welcome-button');
  card.append(title, lines, button);
  backdrop.append(card);
  root.append(backdrop);
  button.addEventListener('click', () => void (backdrop.hidden = true));

  const show = (report: Parameters<typeof toWelcomeView>[0]): void => {
    const view = toWelcomeView(report);
    title.textContent = view.title;
    button.textContent = view.button;
    lines.replaceChildren(...view.lines.map((line) => createEl('p', 'welcome-line', line)));
    backdrop.hidden = false;
  };
  const waiting = inbox.take();
  if (waiting !== null) show(waiting);
  const unsubscribe = inbox.subscribe(show);

  return () => {
    unsubscribe();
    backdrop.remove();
  };
}
