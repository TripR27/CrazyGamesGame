import type { TutorialStep } from '@/data/tutorial/types';

/** The first lesson: ingredient, cauldron, wait, pick the drink up, hand it over, first gold. */
export const basicsLesson: readonly TutorialStep[] = [
  {
    id: 'basics_add',
    lesson: 'basics',
    startWhen: { kind: 'event', event: 'customer:arrived' },
    target: 'guide-ingredient',
    completeOn: { kind: 'event', event: 'ingredient:clicked' },
  },
  {
    id: 'basics_finish',
    lesson: 'basics',
    target: 'guide-ingredient',
    completeOn: { kind: 'event', event: 'brew:started' },
  },
  {
    id: 'basics_wait',
    lesson: 'basics',
    target: 'cauldron',
    completeOn: { kind: 'event', event: 'brew:done' },
    needsLiveState: true,
  },
  {
    id: 'basics_pick',
    lesson: 'basics',
    target: 'guide-drink',
    completeOn: { kind: 'event', event: 'drink:picked' },
    needsLiveState: true,
  },
  {
    id: 'basics_serve',
    lesson: 'basics',
    target: 'guide-customer',
    completeOn: { kind: 'event', event: 'customer:served' },
    needsLiveState: true,
  },
  {
    id: 'basics_gold',
    lesson: 'basics',
    target: 'hud-gold',
    completeOn: { kind: 'after', ms: 4500 },
  },
];
