import { describe, expect, it } from 'vitest';
import { setup } from './helpers';

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
