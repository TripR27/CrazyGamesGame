import { createEl } from '@/app/panels-view';
import { t } from '@/i18n/translator';
import type { Bounds, TargetRegistry } from '@/shared/targets';
import type { TutorialMachine } from '@/tutorial/tutorial';
import { type GuideContext, resolveTarget, arrowPlacement, spotlightBounds, speech } from '@/tutorial/tutorial-guide';
import './tutorial.css';

export interface TutorialUiSource {
  machine: TutorialMachine;
  getGuideContext(): GuideContext;
}

const px = (value: number): string => `${Math.round(value)}px`;

interface Parts {
  view: HTMLElement;
  spot: HTMLElement;
  arrow: HTMLElement;
  text: HTMLElement;
  skip: HTMLElement;
}

function buildParts(): Parts {
  const view = createEl('div', 'tut');
  const spot = createEl('div', 'tut-spot');
  const arrow = createEl('div', 'tut-arrow');
  const text = createEl('p', 'tut-text');
  const skip = createEl('button', 'tut-skip', t('hud.skip_tutorial'));
  const bubble = createEl('div', 'tut-bubble');
  bubble.append(createEl('div', 'tut-mascot'), text, skip);
  view.append(spot, arrow, bubble);
  return { view, spot, arrow, text, skip };
}

function showTarget({ spot, arrow }: Parts, bounds: Bounds | null): void {
  spot.hidden = arrow.hidden = bounds === null;
  if (bounds === null) return;
  const s = spotlightBounds(bounds);
  Object.assign(spot.style, { left: px(s.x), top: px(s.y), width: px(s.w), height: px(s.h) });
  const a = arrowPlacement(bounds);
  arrow.className = a.points === 'up' ? 'tut-arrow tut-arrow--up' : 'tut-arrow';
  Object.assign(arrow.style, { left: px(a.x), top: px(a.y) });
}

/** Dimmed overlay with a spotlight, a pulsing arrow and the mascot's speech bubble. Clicks pass through. */
export function mountTutorial(root: HTMLElement, source: TutorialUiSource, targets: TargetRegistry): () => void {
  const parts = buildParts();
  root.append(parts.view);
  parts.skip.addEventListener('click', () => source.machine.skip());

  let frame = 0;
  const render = (): void => {
    const step = source.machine.visibleStep();
    parts.view.hidden = step === null;
    cancelAnimationFrame(frame);
    if (step === null) return;
    const follow = (): void => {
      const ctx = source.getGuideContext();
      const line = speech(step.id, ctx);
      if (parts.text.textContent !== line) parts.text.textContent = line;
      const id = resolveTarget(step.target, ctx);
      showTarget(parts, id === null ? null : targets.resolve(id));
      frame = requestAnimationFrame(follow);
    };
    follow();
  };

  const unsubscribe = source.machine.subscribe(render);
  render();
  return () => {
    unsubscribe();
    cancelAnimationFrame(frame);
    parts.view.remove();
  };
}
