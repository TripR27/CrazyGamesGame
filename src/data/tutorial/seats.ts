import type { TutorialStep } from './types';

/** The hint for the first extra seat: you start with one seat, so more customers need a purchase. */
export const seatsLesson: readonly TutorialStep[] = [
  {
    id: 'seats_buy',
    lesson: 'seats',
    startWhen: { kind: 'event', event: 'seats:affordable' },
    target: 'guide-seats',
    completeOn: { kind: 'event', event: 'seats:bought' },
  },
  {
    id: 'seats_done',
    lesson: 'seats',
    target: 'hud-gold',
    completeOn: { kind: 'after', ms: 4500 },
  },
];
