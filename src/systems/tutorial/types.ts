import type { TutorialProgress } from '@/core/state';
import type { TutorialEvent, TutorialStep } from '@/data/tutorial';

/** Where the machine keeps its progress. In the game this is a slice of the saved state. */
export interface ProgressStore {
  get(): TutorialProgress;
  update(mutator: (progress: TutorialProgress) => void): void;
}

/** True when the situation a start event announces already holds, e.g. a customer is already seated. */
export type AlreadyHolds = (event: TutorialEvent) => boolean;

export interface TutorialMachine {
  /** The step to show right now, or null while hidden, finished or skipped. */
  visibleStep(): TutorialStep | null;
  /** True while there are tutorial steps left to do (not finished and not skipped). */
  isActive(): boolean;
  /** A real game event happened. Starts, completes or skips ahead steps. */
  onEvent(event: TutorialEvent): void;
  /** Game time passed (for steps that complete after a delay). */
  onTick(deltaMs: number): void;
  skip(): void;
  /** Play the tutorial again from the start. */
  restart(): void;
  /** Called whenever what `visibleStep()` returns may have changed. Returns an unsubscribe function. */
  subscribe(listener: () => void): () => void;
}
