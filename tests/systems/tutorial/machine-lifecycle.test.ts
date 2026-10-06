import { describe, expect, it, vi } from 'vitest';
import { setup } from './helpers';

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
