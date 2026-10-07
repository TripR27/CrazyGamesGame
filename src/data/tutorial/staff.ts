import type { TutorialStep } from '@/data/tutorial/types';

/** The hint for the first staff member: starts when the player can pay for one, then done. */
export const staffLesson: readonly TutorialStep[] = [
  {
    id: 'staff_hire',
    lesson: 'staff',
    startWhen: { kind: 'event', event: 'staff:affordable' },
    target: 'guide-staff',
    completeOn: { kind: 'event', event: 'staff:hired' },
  },
  {
    id: 'staff_done',
    lesson: 'staff',
    target: 'hud-gold',
    completeOn: { kind: 'after', ms: 4500 },
  },
];
