import { describe, expect, it, vi } from 'vitest';
import type { TutorialProgress } from '@/shared/state';
import { createTutorialMachine, type AlreadyHolds } from '@/tutorial/tutorial';
import type { TutorialStep } from '@/tutorial/tutorial-steps';

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

describe('tutorial machine: following the game', () => {
  it('stays hidden until the start event, then shows the first step', () => {
    const { machine, shown } = setup();
    expect(shown()).toBeNull();
    machine.onEvent('saveRequested'); // unrelated to every step
    expect(shown()).toBeNull();
    machine.onEvent('customer:arrived');
    expect(shown()).toBe('a');
  });

  it('treats the last action of the tutorial as having done everything before it', () => {
    const { machine, progress, shown } = setup();
    machine.onEvent('customer:arrived');
    machine.onEvent('customer:served');
    expect(progress.completedSteps).toEqual(['a', 'b', 'c', 'd', 'e']);
    expect(shown()).toBeNull();
  });

  it('goes through the steps in order', () => {
    const { machine, progress, shown } = setup();
    machine.onEvent('customer:arrived');
    machine.onEvent('ingredient:clicked');
    expect(shown()).toBe('b');
    machine.onEvent('ingredient:clicked'); // repeating an earlier action changes nothing
    expect(shown()).toBe('b');
    machine.onEvent('brew:started');
    expect(shown()).toBe('c');
    expect(progress.completedSteps).toEqual(['a', 'b']);
  });

  it('finishes earlier steps when the player is ahead of the tutorial', () => {
    const { machine, progress, shown } = setup();
    machine.onEvent('brew:started'); // before the first customer even arrived
    expect(progress.completedSteps).toEqual(['a', 'b']);
    expect(shown()).toBe('c');
  });

  it('completes timed steps after enough game time, counted from when they show', () => {
    const { machine, progress, shown } = setup({ completedSteps: ['a', 'b', 'c'] });
    machine.onTick(5000); // the tutorial already shows d, so this counts
    expect(progress.completedSteps).toContain('d');
    expect(shown()).toBe('e');

    const slow = setup({ completedSteps: ['a', 'b', 'c'] });
    slow.machine.onTick(600);
    expect(slow.shown()).toBe('d');
    slow.machine.onTick(400);
    expect(slow.shown()).toBe('e');
  });

  it('ignores time while an event step is showing', () => {
    const { machine, shown } = setup();
    machine.onEvent('customer:arrived');
    machine.onTick(60_000);
    expect(shown()).toBe('a');
  });
});

describe('tutorial machine: skipping, restarting, finishing', () => {
  it('can always be skipped; nothing shows afterwards and the choice is saved', () => {
    const { machine, progress, shown } = setup();
    machine.onEvent('customer:arrived');
    machine.skip();
    expect(shown()).toBeNull();
    expect(machine.isActive()).toBe(false);
    expect(progress.skipped).toBe(true);
    machine.onEvent('ingredient:clicked');
    expect(progress.completedSteps).toEqual([]);
  });

  it('can be played again from the start', () => {
    const { machine, progress, shown } = setup();
    machine.skip();
    machine.restart();
    expect(progress).toEqual({ completedSteps: [], skipped: false });
    expect(machine.isActive()).toBe(true);
    machine.onEvent('customer:arrived');
    expect(shown()).toBe('a');
  });

  it('starts at once when what the start event announces already holds, e.g. replaying with a customer seated', () => {
    const seated = () => true;
    const { machine, shown } = setup({}, seated);
    expect(shown()).toBe('a');
    machine.skip();
    machine.restart();
    expect(shown()).toBe('a');
  });

  it('is no longer active once every step is done', () => {
    const { machine } = setup();
    machine.onEvent('customer:served');
    expect(machine.isActive()).toBe(false);
    expect(machine.visibleStep()).toBeNull();
  });

  it('tells listeners about every change, until they unsubscribe', () => {
    const { machine } = setup();
    const listener = vi.fn();
    const stop = machine.subscribe(listener);
    machine.onEvent('customer:arrived');
    machine.onEvent('ingredient:clicked');
    expect(listener).toHaveBeenCalledTimes(2);
    machine.skip();
    expect(listener).toHaveBeenCalledTimes(3);
    stop();
    machine.restart();
    expect(listener).toHaveBeenCalledTimes(3);
  });
});

describe('tutorial machine: resuming after a reload', () => {
  it('resumes at the open step when nothing live is needed', () => {
    const { shown, progress } = setup({ completedSteps: ['a', 'b', 'c'] });
    expect(progress.completedSteps).toEqual(['a', 'b', 'c']);
    expect(shown()).toBe('d');
  });

  it('restarts the lesson when the open step needs the cauldron or bar, which are not saved', () => {
    const { shown, progress, machine } = setup({ completedSteps: ['a', 'b'] });
    expect(progress.completedSteps).toEqual([]);
    expect(shown()).toBeNull();
    machine.onEvent('customer:arrived');
    expect(shown()).toBe('a');
  });

  it('does not touch other lessons or a finished tutorial', () => {
    const { progress } = setup({ completedSteps: ['a', 'b', 'c', 'd', 'e'] });
    expect(progress.completedSteps).toEqual(['a', 'b', 'c', 'd', 'e']);
    expect(setup({ skipped: true, completedSteps: ['a'] }).progress.completedSteps).toEqual(['a']);
  });
});

/** Lesson one, then a lesson that starts later and first only asks the player to open the shop tab. */
const stepsShown: TutorialStep[] = [
  { id: 'first', lesson: 'l', target: 'hud-gold', completeOn: { kind: 'event', event: 'customer:served' } },
  {
    id: 'open', lesson: 'm', startWhen: { kind: 'event', event: 'upgrade:affordable' }, target: 'guide-shop',
    completeOn: { kind: 'event', event: 'shop:opened' }, onlyWhenShown: true,
  },
  { id: 'buy', lesson: 'm', target: 'guide-upgrade', completeOn: { kind: 'event', event: 'upgrade:bought' } },
];

function setupShown(alreadyHolds: AlreadyHolds = () => false) {
  const progress: TutorialProgress = { completedSteps: [], skipped: false };
  const machine = createTutorialMachine(stepsShown, { get: () => progress, update: (m) => m(progress) }, alreadyHolds);
  return { machine, progress, shown: () => machine.visibleStep()?.id ?? null };
}

describe('tutorial stepsShown that only ask the player to get somewhere', () => {
  it('are not finished ahead of time by opening the panel early, so earlier lessons stay', () => {
    const { machine, progress, shown } = setupShown();
    machine.onEvent('shop:opened');
    expect(progress.completedSteps).toEqual([]);
    expect(shown()).toBe('first');
  });

  it('are finished by their event while they are on screen', () => {
    const { machine, shown } = setupShown();
    machine.onEvent('customer:served');
    machine.onEvent('shop:opened'); // the lesson has not started yet
    expect(shown()).toBeNull();
    machine.onEvent('upgrade:affordable');
    expect(shown()).toBe('open');
    machine.onEvent('shop:opened');
    expect(shown()).toBe('buy');
  });

  it('are done at once when the player is already there as the step shows', () => {
    const { machine, shown } = setupShown((event) => event === 'upgrade:affordable' || event === 'shop:opened');
    machine.onEvent('customer:served');
    expect(shown()).toBe('buy');
  });

  it('still let a real action of a later step finish everything before it', () => {
    const { machine, progress } = setupShown();
    machine.onEvent('upgrade:bought');
    expect(progress.completedSteps).toEqual(['first', 'open', 'buy']);
  });
});
