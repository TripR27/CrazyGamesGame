import type { TutorialProgress } from '@/core/state';
import type { TutorialStep } from '@/data/tutorial';
import { createTutorialMachine, type AlreadyHolds } from '@/systems/tutorial';

export const steps: TutorialStep[] = [
  { id: 'a', lesson: 'l', startWhen: { kind: 'event', event: 'customer:arrived' }, target: 'cauldron', completeOn: { kind: 'event', event: 'ingredient:clicked' } },
  { id: 'b', lesson: 'l', target: 'cauldron', completeOn: { kind: 'event', event: 'brew:started' } },
  { id: 'c', lesson: 'l', target: 'cauldron', completeOn: { kind: 'event', event: 'brew:done' }, needsLiveState: true },
  { id: 'd', lesson: 'l', target: 'hud-gold', completeOn: { kind: 'after', ms: 1000 } },
  { id: 'e', lesson: 'm', target: 'hud-gold', completeOn: { kind: 'event', event: 'customer:served' } },
];

export function setup(initial: Partial<TutorialProgress> = {}, alreadyHolds?: AlreadyHolds) {
  const progress: TutorialProgress = { completedSteps: [], skipped: false, ...initial };
  const machine = createTutorialMachine(steps, { get: () => progress, update: (m) => m(progress) }, alreadyHolds);
  const shown = () => machine.visibleStep()?.id ?? null;
  return { machine, progress, shown };
}
