import type { TutorialStep } from '@/data/tutorial/types';

/** The hint for the first VIP: points at them until they get their (expensive) drink. */
export const vipLesson: readonly TutorialStep[] = [
  {
    id: 'vip_spot',
    lesson: 'vip',
    startWhen: { kind: 'event', event: 'vip:arrived' },
    target: 'guide-vip',
    completeOn: { kind: 'event', event: 'vip:served' },
  },
  {
    id: 'vip_done',
    lesson: 'vip',
    target: 'hud-gold',
    completeOn: { kind: 'after', ms: 4500 },
  },
];
