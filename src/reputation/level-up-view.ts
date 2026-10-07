import { createEl } from '@/app/panels-view';
import type { LevelUpView } from '@/reputation/level-up-model';
import './level-up.css';

const SHOW_MS = 4500;

/** A short message at the top of the game when the player reaches a new reputation level. Clicks pass through. */
export function mountLevelUpToast(root: HTMLElement, onLevelUp: (show: (view: LevelUpView) => void) => () => void): () => void {
  const toast = createEl('div', 'level-up');
  toast.hidden = true;
  root.append(toast);
  let timer: ReturnType<typeof setTimeout> | undefined;

  const show = (view: LevelUpView): void => {
    toast.replaceChildren(createEl('p', 'level-up-title', view.title), ...view.lines.map((l) => createEl('p', 'level-up-line', l)));
    toast.hidden = false;
    clearTimeout(timer);
    timer = setTimeout(() => void (toast.hidden = true), SHOW_MS);
  };
  const unsubscribe = onLevelUp(show);
  return () => {
    unsubscribe();
    clearTimeout(timer);
    toast.remove();
  };
}
