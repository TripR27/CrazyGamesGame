import { describe, expect, it } from 'vitest';
import type { TutorialProgress } from '@/core/state';
import type { TutorialStep } from '@/data/tutorial';
import { createTutorialMachine, type AlreadyHolds } from '@/systems/tutorial';

/** Lesson one, then a lesson that starts later and first only asks the player to open the shop tab. */
const steps: TutorialStep[] = [
  { id: 'first', lesson: 'l', target: 'hud-gold', completeOn: { kind: 'event', event: 'customer:served' } },
  {
    id: 'open', lesson: 'm', startWhen: { kind: 'event', event: 'upgrade:affordable' }, target: 'guide-shop',
    completeOn: { kind: 'event', event: 'shop:opened' }, onlyWhenShown: true,
  },
  { id: 'buy', lesson: 'm', target: 'guide-upgrade', completeOn: { kind: 'event', event: 'upgrade:bought' } },
];

function setup(alreadyHolds: AlreadyHolds = () => false) {
  const progress: TutorialProgress = { completedSteps: [], skipped: false };
  const machine = createTutorialMachine(steps, { get: () => progress, update: (m) => m(progress) }, alreadyHolds);
  return { machine, progress, shown: () => machine.visibleStep()?.id ?? null };
}

describe('tutorial steps that only ask the player to get somewhere', () => {
  it('are not finished ahead of time by opening the panel early, so earlier lessons stay', () => {
    const { machine, progress, shown } = setup();
    machine.onEvent('shop:opened');
    expect(progress.completedSteps).toEqual([]);
    expect(shown()).toBe('first');
  });

  it('are finished by their event while they are on screen', () => {
    const { machine, shown } = setup();
    machine.onEvent('customer:served');
    machine.onEvent('shop:opened'); // the lesson has not started yet
    expect(shown()).toBeNull();
    machine.onEvent('upgrade:affordable');
    expect(shown()).toBe('open');
    machine.onEvent('shop:opened');
    expect(shown()).toBe('buy');
  });

  it('are done at once when the player is already there as the step shows', () => {
    const { machine, shown } = setup((event) => event === 'upgrade:affordable' || event === 'shop:opened');
    machine.onEvent('customer:served');
    expect(shown()).toBe('buy');
  });

  it('still let a real action of a later step finish everything before it', () => {
    const { machine, progress } = setup();
    machine.onEvent('upgrade:bought');
    expect(progress.completedSteps).toEqual(['first', 'open', 'buy']);
  });
});
