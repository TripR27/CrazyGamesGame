import type { Clock } from '@/core/clock';

export const DEFAULT_STEP_MS = 100;
export const DEFAULT_GAP_THRESHOLD_MS = 5000;

export interface TickerOptions {
  clock: Clock;
  onStep: (stepMs: number) => void;
  /** Called instead of simulating steps when more time passed than the threshold (tab hidden, sleep). */
  onGap?: (gapMs: number) => void;
  stepMs?: number;
  gapThresholdMs?: number;
}

export interface Ticker {
  /** Process the wall-clock time elapsed since the last call as fixed steps. */
  advance(): void;
}

export function createTicker(options: TickerOptions): Ticker {
  const { clock, onStep, onGap } = options;
  const stepMs = options.stepMs ?? DEFAULT_STEP_MS;
  const gapThresholdMs = options.gapThresholdMs ?? DEFAULT_GAP_THRESHOLD_MS;
  let last = clock.now();
  let accumulator = 0;

  return {
    advance() {
      const now = clock.now();
      const delta = now - last;
      last = now;
      if (delta <= 0) return;
      if (delta > gapThresholdMs) {
        onGap?.(delta);
        return;
      }
      accumulator += delta;
      while (accumulator >= stepMs) {
        accumulator -= stepMs;
        onStep(stepMs);
      }
    },
  };
}
