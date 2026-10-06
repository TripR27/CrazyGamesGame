import type { TutorialStep } from './types';

/** The hint for the recipe book: once the first recipes can be discovered (level 2), open the book and read. */
export const bookLesson: readonly TutorialStep[] = [
  {
    id: 'book_open',
    lesson: 'book',
    startWhen: { kind: 'event', event: 'reputation:levelUp' },
    target: 'book-button',
    completeOn: { kind: 'event', event: 'book:opened' },
  },
  {
    id: 'book_read',
    lesson: 'book',
    target: 'book-panel',
    completeOn: { kind: 'after', ms: 7000 },
  },
];
