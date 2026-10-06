import { describe, expect, it, vi } from 'vitest';
import type { Clock } from '@/core/clock';
import { createTicker } from '@/core/ticker';

function fakeClock(start = 1000): Clock & { advanceBy(ms: number): void } {
  let time = start;
  return {
    now: () => time,
    advanceBy(ms) {
      time += ms;
    },
  };
}

describe('ticker', () => {
  it('runs one fixed step per 100 ms and keeps the remainder', () => {
    const clock = fakeClock();
    const onStep = vi.fn();
    const ticker = createTicker({ clock, onStep });

    clock.advanceBy(250);
    ticker.advance();
    expect(onStep).toHaveBeenCalledTimes(2);
    expect(onStep).toHaveBeenCalledWith(100);

    clock.advanceBy(50);
    ticker.advance();
    expect(onStep).toHaveBeenCalledTimes(3);
  });

  it('does nothing when no time has passed', () => {
    const clock = fakeClock();
    const onStep = vi.fn();
    createTicker({ clock, onStep }).advance();
    expect(onStep).not.toHaveBeenCalled();
  });

  it('reports a long gap instead of simulating every step', () => {
    const clock = fakeClock();
    const onStep = vi.fn();
    const onGap = vi.fn();
    const ticker = createTicker({ clock, onStep, onGap });

    clock.advanceBy(60 * 60 * 1000);
    ticker.advance();

    expect(onGap).toHaveBeenCalledWith(3_600_000);
    expect(onStep).not.toHaveBeenCalled();

    clock.advanceBy(100);
    ticker.advance();
    expect(onStep).toHaveBeenCalledTimes(1);
  });

  it('survives the clock going backwards', () => {
    const clock = fakeClock();
    const onStep = vi.fn();
    const ticker = createTicker({ clock, onStep });

    clock.advanceBy(-500);
    expect(() => ticker.advance()).not.toThrow();
    expect(onStep).not.toHaveBeenCalled();

    clock.advanceBy(100);
    ticker.advance();
    expect(onStep).toHaveBeenCalledTimes(1);
  });

  it('respects custom step and gap settings', () => {
    const clock = fakeClock();
    const onStep = vi.fn();
    const onGap = vi.fn();
    const ticker = createTicker({ clock, onStep, onGap, stepMs: 50, gapThresholdMs: 200 });

    clock.advanceBy(150);
    ticker.advance();
    expect(onStep).toHaveBeenCalledTimes(3);

    clock.advanceBy(300);
    ticker.advance();
    expect(onGap).toHaveBeenCalledWith(300);
  });
});
