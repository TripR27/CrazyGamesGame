import type { TutorialStep } from './types';

/** The hint for the first room: starts once one can be built, then points at it on the upper floor. */
export const roomLesson: readonly TutorialStep[] = [
  {
    id: 'room_buy',
    lesson: 'room',
    startWhen: { kind: 'event', event: 'rooms:affordable' },
    target: 'guide-room-buy',
    completeOn: { kind: 'event', event: 'room:built' },
  },
  {
    id: 'room_done',
    lesson: 'room',
    target: 'guide-new-room',
    completeOn: { kind: 'after', ms: 5500 },
  },
];
