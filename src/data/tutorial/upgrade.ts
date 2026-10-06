import type { TutorialStep } from './types';

/** The hint for the first upgrade: starts when the player can pay for one, then open shop, buy, done. */
export const upgradeLesson: readonly TutorialStep[] = [
  {
    id: 'upgrade_open',
    lesson: 'upgrade',
    startWhen: { kind: 'event', event: 'upgrade:affordable' },
    target: 'shop-button',
    completeOn: { kind: 'event', event: 'shop:opened' },
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
