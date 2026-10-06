import type { TutorialEvent, TutorialStep } from '@/data/tutorial';
import { firstOpenStep, rewindForResume } from './progress';
import type { AlreadyHolds, ProgressStore, TutorialMachine } from './types';

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

/** A step shows at once if it has no start event, or if what that event announces is already true. */
function begin(s: Session): void {
  s.elapsedMs = 0;
  const start = current(s)?.startWhen;
  s.started = start === undefined || s.alreadyHolds(start.event);
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
  const later = [...s.steps]
    .reverse()
    .find((step) => !done.includes(step.id) && step.completeOn.kind === 'event' && step.completeOn.event === event);
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
