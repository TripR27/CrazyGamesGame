import { ingredients } from '@/brewing/ingredients';
import { customers } from '@/customers/customer-data';
import { ingredientTable } from '@/data/validate/ingredient-table';
import { reputationTable } from '@/data/validate/reputation-table';
import { roomTable } from '@/data/validate/room-table';
import type { ContentTable } from '@/data/validate/table';
import { customerTable, feedbackTable, recipeTable, upgradeTable } from '@/data/validate/tables';
import { tutorialTable } from '@/data/validate/tutorial-table';
import { upgrades } from '@/economy/upgrade-data';
import { recipes } from '@/recipes/recipe-data';
import { REPUTATION_LEVELS } from '@/reputation/reputation';
import { ROOMS } from '@/rooms/rooms';
import { FEEDBACK_POOLS } from '@/shared/random';
import { TUTORIAL_STEPS } from '@/tutorial/tutorial-steps';

/** Every content list the validator checks. A new domain is one more line here. */
export const CONTENT_TABLES: readonly ContentTable[] = [
  ingredientTable(ingredients),
  recipeTable(recipes),
  customerTable(customers),
  upgradeTable(upgrades),
  feedbackTable(FEEDBACK_POOLS),
  tutorialTable(TUTORIAL_STEPS),
  reputationTable(REPUTATION_LEVELS),
  roomTable(ROOMS),
];
