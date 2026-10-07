import { customers } from '@/data/customers/index';
import { ingredients } from '@/data/ingredients/index';
import { TUTORIAL_STEPS } from '@/data/tutorial/index';
import { upgrades } from '@/data/upgrades/index';
import { ingredientTable } from '@/data/validate/ingredient-table';
import { reputationTable } from '@/data/validate/reputation-table';
import { roomTable } from '@/data/validate/room-table';
import type { ContentTable } from '@/data/validate/table';
import { customerTable, feedbackTable, recipeTable, upgradeTable } from '@/data/validate/tables';
import { tutorialTable } from '@/data/validate/tutorial-table';
import { recipes } from '@/recipes/recipe-data';
import { REPUTATION_LEVELS } from '@/reputation/reputation';
import { ROOMS } from '@/rooms/rooms';
import { FEEDBACK_POOLS } from '@/shared/random';

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
