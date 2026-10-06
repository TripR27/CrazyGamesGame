import type { GameEvents } from '@/core/game-events';

export type TutorialEvent = keyof GameEvents;

export interface EventTrigger {
  kind: 'event';
  event: TutorialEvent;
}

/** `after` counts game time from the moment the step became visible. */
export type Trigger = EventTrigger | { kind: 'after'; ms: number };

/**
 * One tutorial step. The speech text is the i18n key `tutorial.<id>.text`.
 * `target` is a registry id or one of the guide aliases (see targets.ts).
 */
export interface TutorialStep {
  id: string;
  /** Steps of one lesson belong together; a lesson that cannot be resumed mid-way restarts. */
  lesson: string;
  /** The step stays hidden until this happens. Omitted: it shows as soon as the previous step is done. */
  startWhen?: EventTrigger;
  target: string;
  completeOn: Trigger;
  /** The step relies on things that are not saved (cauldron, bar); after a reload the lesson restarts. */
  needsLiveState?: boolean;
  /**
   * The completing event is only a way to get somewhere (opening a panel tab), not a real action: it counts only
   * while this step is on screen and never finishes it ahead of time. Already there when the step shows: done at once.
   */
  onlyWhenShown?: boolean;
}
