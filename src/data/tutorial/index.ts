import { basicsLesson } from './basics';
import { upgradeLesson } from './upgrade';
import type { TutorialStep } from './types';

export type { EventTrigger, Trigger, TutorialEvent, TutorialStep } from './types';

/** All tutorial steps in order. A new lesson is a new file plus one spread here. */
export const TUTORIAL_STEPS: readonly TutorialStep[] = [...basicsLesson, ...upgradeLesson];
