import type { TutorialStep } from '@/data/tutorial/types';

/** The hint for the first upgrade: starts when the player can pay for one, then unfold the panel on the shop tab, buy, done. */
export const upgradeLesson: readonly TutorialStep[] = [
  {
    id: 'upgrade_open',
    lesson: 'upgrade',
    startWhen: { kind: 'event', event: 'upgrade:affordable' },
    target: 'guide-shop',
    completeOn: { kind: 'event', event: 'shop:opened' },
    onlyWhenShown: true,
  },
  {
    id: 'upgrade_buy',
    lesson: 'upgrade',
    target: 'guide-upgrade',
    completeOn: { kind: 'event', event: 'upgrade:bought' },
  },
  {
    id: 'upgrade_done',
    lesson: 'upgrade',
    target: 'hud-gold',
    completeOn: { kind: 'after', ms: 4500 },
  },
];
