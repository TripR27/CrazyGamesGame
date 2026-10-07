import { positive } from '@/data/validate/rules';
import { defineTable, type ContentTable } from '@/data/validate/table';
import { KNOWN_TARGETS, type TutorialStep } from '@/tutorial/tutorial-steps';

/** Lessons whose steps are not next to each other: "restart the lesson" would then skip steps. */
function splitLessons(steps: readonly TutorialStep[]): string[] {
  const lessons = [...new Set(steps.map((s) => s.lesson))];
  return lessons.filter((lesson) => {
    const positions = steps.flatMap((s, i) => (s.lesson === lesson ? [i] : []));
    return Math.max(...positions) - Math.min(...positions) + 1 !== positions.length;
  });
}

export const tutorialTable = (items: readonly TutorialStep[]): ContentTable =>
  defineTable({
    domain: 'tutorial',
    items,
    textFields: ['text'],
    check: (step) => [
      ...(step.lesson === '' ? ['lesson must not be empty'] : []),
      ...(KNOWN_TARGETS.includes(step.target) ? [] : [`unknown target "${step.target}"`]),
      ...(step.completeOn.kind === 'after' ? positive(step.completeOn.ms, 'completeOn.ms') : []),
    ],
    checkSet: (all) => splitLessons(all).map((lesson) => `lesson ${lesson} has steps that are not next to each other`),
  });
