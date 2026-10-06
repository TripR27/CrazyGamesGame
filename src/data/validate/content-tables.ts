import { customers } from '@/data/customers';
import { FEEDBACK_POOLS } from '@/data/feedback';
import { ingredients } from '@/data/ingredients';
import { recipes } from '@/data/recipes';
import { REPUTATION_LEVELS } from '@/data/reputation/levels';
import { ROOMS } from '@/data/rooms';
import { TUTORIAL_STEPS } from '@/data/tutorial';
import { upgrades } from '@/data/upgrades';
import type { ContentTable } from './table';
import { customerTable, feedbackTable, recipeTable, upgradeTable } from './tables';
import { ingredientTable } from './ingredient-table';
import { reputationTable } from './reputation-table';
import { roomTable } from './room-table';
import { tutorialTable } from './tutorial-table';

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
