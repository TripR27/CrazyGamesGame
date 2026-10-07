import { basicsLesson } from '@/data/tutorial/basics';
import { bookLesson } from '@/data/tutorial/book';
import { ingredientLesson } from '@/data/tutorial/ingredient';
import { likesLesson } from '@/data/tutorial/likes';
import { roomLesson } from '@/data/tutorial/room';
import { seatsLesson } from '@/data/tutorial/seats';
import { staffLesson } from '@/data/tutorial/staff';
import type { TutorialStep } from '@/data/tutorial/types';
import { upgradeLesson } from '@/data/tutorial/upgrade';
import { vipLesson } from '@/data/tutorial/vip';

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
