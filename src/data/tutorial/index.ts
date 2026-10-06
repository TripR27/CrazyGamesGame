import { basicsLesson } from './basics';
import { bookLesson } from './book';
import { ingredientLesson } from './ingredient';
import { likesLesson } from './likes';
import { roomLesson } from './room';
import { seatsLesson } from './seats';
import { staffLesson } from './staff';
import { upgradeLesson } from './upgrade';
import { vipLesson } from './vip';
import type { TutorialStep } from './types';

export type { EventTrigger, Trigger, TutorialEvent, TutorialStep } from './types';

/** All tutorial steps in order. A new lesson is a new file plus one spread here. */
export const TUTORIAL_STEPS: readonly TutorialStep[] = [
  ...basicsLesson,
  ...likesLesson,
  ...upgradeLesson,
  ...seatsLesson,
  ...bookLesson,
  ...ingredientLesson,
  ...staffLesson,
  ...vipLesson,
  ...roomLesson,
];
