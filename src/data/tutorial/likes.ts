import type { TutorialStep } from './types';

/** The hint for customer preferences: starts at the first order of a liked drink (♥), done once one is served. */
export const likesLesson: readonly TutorialStep[] = [
  {
    id: 'likes_spot',
    lesson: 'likes',
    startWhen: { kind: 'event', event: 'likes:ordered' },
    target: 'guide-liked',
    completeOn: { kind: 'event', event: 'likes:served' },
  },
  {
    id: 'likes_done',
    lesson: 'likes',
    target: 'hud-gold',
    completeOn: { kind: 'after', ms: 6000 },
  },
];
