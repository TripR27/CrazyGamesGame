import type { TutorialProgress } from '@/shared/state';
import type { TutorialEvent, TutorialStep } from '@/tutorial/tutorial-steps';

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

export function firstOpenStep(steps: readonly TutorialStep[], progress: TutorialProgress): TutorialStep | null {
  if (progress.skipped) return null;
  return steps.find((s) => !progress.completedSteps.includes(s.id)) ?? null;
}

/**
 * Called once when the game loads. Things like the cauldron and the bar are not saved, so a lesson that
 * stopped at a step that depends on them starts from its first step again. Other steps simply resume.
 */
export function rewindForResume(steps: readonly TutorialStep[], progress: TutorialProgress): void {
  const open = firstOpenStep(steps, progress);
  if (open === null || open.needsLiveState !== true) return;
  const lessonIds = new Set(steps.filter((s) => s.lesson === open.lesson).map((s) => s.id));
  progress.completedSteps = progress.completedSteps.filter((id) => !lessonIds.has(id));
}

interface Session {
  steps: readonly TutorialStep[];
  store: ProgressStore;
  alreadyHolds: AlreadyHolds;
  listeners: Set<() => void>;
  /** The open step is visible (its startWhen happened, or it has none). */
  started: boolean;
  elapsedMs: number;
}

const current = (s: Session): TutorialStep | null => firstOpenStep(s.steps, s.store.get());
const notify = (s: Session): void => s.listeners.forEach((l) => l());

/**
 * A step shows at once if it has no start event, or if what that event announces is already true. A step that
 * only waits for the player to get somewhere is done at once when they are already there.
 */
function begin(s: Session): void {
  s.elapsedMs = 0;
  const open = current(s);
  s.started = open?.startWhen === undefined || s.alreadyHolds(open.startWhen.event);
  const done = open?.completeOn;
  if (s.started && open?.onlyWhenShown === true && done?.kind === 'event' && s.alreadyHolds(done.event)) completeThrough(s, open);
}

/** Finish this step and every earlier one: doing a later step's action first never leaves the tutorial stuck. */
function completeThrough(s: Session, last: TutorialStep): void {
  const upTo = s.steps.slice(0, s.steps.indexOf(last) + 1);
  s.store.update((progress) => {
    for (const step of upTo) {
      if (!progress.completedSteps.includes(step.id)) progress.completedSteps.push(step.id);
    }
  });
  begin(s);
  notify(s);
}

function handleEvent(s: Session, event: TutorialEvent): void {
  const open = current(s);
  if (open === null) return;
  const done = s.store.get().completedSteps;
  const counts = (step: TutorialStep): boolean => step.onlyWhenShown !== true || (step === open && s.started);
  const later = [...s.steps]
    .reverse()
    .find((step) => !done.includes(step.id) && step.completeOn.kind === 'event' && step.completeOn.event === event && counts(step));
  if (later !== undefined) return completeThrough(s, later);
  if (!s.started && open.startWhen?.event === event) {
    s.started = true;
    notify(s);
  }
}

function handleTick(s: Session, deltaMs: number): void {
  const open = current(s);
  if (!s.started || open === null || open.completeOn.kind !== 'after') return;
  s.elapsedMs += deltaMs;
  if (s.elapsedMs >= open.completeOn.ms) completeThrough(s, open);
}

/**
 * Drives the tutorial from real game events. The player never presses "next": a step is done when the
 * action really happens.
 */
export function createTutorialMachine(
  steps: readonly TutorialStep[],
  store: ProgressStore,
  alreadyHolds: AlreadyHolds = () => false,
): TutorialMachine {
  const session: Session = { steps, store, alreadyHolds, listeners: new Set(), started: false, elapsedMs: 0 };
  store.update((progress) => rewindForResume(steps, progress));
  begin(session);

  const change = (mutator: Parameters<ProgressStore['update']>[0]): void => {
    store.update(mutator);
    begin(session);
    notify(session);
  };

  return {
    visibleStep: () => (session.started ? current(session) : null),
    isActive: () => current(session) !== null,
    onEvent: (event) => handleEvent(session, event),
    onTick: (deltaMs) => handleTick(session, deltaMs),
    skip: () => change((progress) => void (progress.skipped = true)),
    restart: () =>
      change((progress) => {
        progress.completedSteps = [];
        progress.skipped = false;
      }),
    subscribe(listener) {
      session.listeners.add(listener);
      return () => session.listeners.delete(listener);
    },
  };
}
