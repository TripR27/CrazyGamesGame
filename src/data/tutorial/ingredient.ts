import type { TutorialStep } from './types';

/** The hint for the first ingredient from the shop: starts once one can be bought, then points at it on the shelf. */
export const ingredientLesson: readonly TutorialStep[] = [
  {
    id: 'ingredient_buy',
    lesson: 'ingredient',
    startWhen: { kind: 'event', event: 'ingredients:affordable' },
    target: 'guide-ingredient-buy',
    completeOn: { kind: 'event', event: 'ingredient:bought' },
  },
  {
    id: 'ingredient_done',
    lesson: 'ingredient',
    target: 'guide-new-ingredient',
    completeOn: { kind: 'after', ms: 5500 },
  },
];
