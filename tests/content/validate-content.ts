import { type ContentTable, customerTable, feedbackTable, recipeTable, upgradeTable, isTier, oneOf, positive, tierRule, defineTable } from './validate-core';
import { ingredients, type IngredientDef } from '@/brewing/ingredients';
import { customers } from '@/customers/customer-data';
import { upgrades, UPGRADE_STATS } from '@/economy/upgrade-data';
import { recipes } from '@/recipes/recipe-data';
import { REPUTATION_LEVELS, type ReputationLevel } from '@/reputation/reputation';
import { ROOMS, type RoomDef } from '@/rooms/rooms';
import { RARITIES } from '@/shared/content';
import { FEEDBACK_POOLS } from '@/shared/random';
import { TUTORIAL_STEPS, KNOWN_TARGETS, type TutorialStep } from '@/tutorial/tutorial-steps';

const SOURCE_PATTERN = /^(shop|dungeon:[a-z][a-z0-9_]*)$/;

/** A shop purchase opens at a level after the first (level 1 ingredients are simply basic) and costs gold. */
const buyRule = (i: IngredientDef): string[] => [
  ...(i.source === 'shop' ? [] : ['only shop ingredients can be bought']),
  ...(isTier(i.buy?.level ?? 0) && (i.buy?.level ?? 0) >= 2 && (i.buy?.level ?? 0) <= REPUTATION_LEVELS.length
    ? [] : [`buy.level must be a level from 2 to ${REPUTATION_LEVELS.length}`]),
  ...positive(i.buy?.cost ?? 0, 'buy.cost'),
];

export const ingredientTable = (items: readonly IngredientDef[]): ContentTable =>
  defineTable({
    domain: 'ingredients',
    items,
    textFields: ['name'],
    check: (i) => [
      ...tierRule(i.tier),
      ...oneOf(i.rarity, RARITIES, 'rarity'),
      ...(SOURCE_PATTERN.test(i.source) ? [] : [`source "${i.source}" must be shop or dungeon:<id>`]),
      ...(i.buy === undefined ? [] : buyRule(i)),
    ],
  });

/** Levels need a name, must start at 0 and climb, and may only unlock recipes that exist. */
export const reputationTable = (items: readonly ReputationLevel[]): ContentTable =>
  defineTable({
    domain: 'reputation',
    items,
    textFields: ['name'],
    check: (level, ctx) =>
      (level.unlocks ?? []).filter((id) => !ctx.has('recipes', id)).map((id) => `unlocks unknown recipe "${id}"`),
    checkSet: (all) => [
      ...(all[0]?.minReputation === 0 ? [] : ['the first level must start at 0 reputation']),
      ...all
        .filter((level, i) => i > 0 && level.minReputation <= (all[i - 1]?.minReputation ?? 0))
        .map((level) => `level ${level.id} must need more reputation than the one before`),
    ],
  });

/** Rooms open at a level after the first, cost gold, have a whole number of seats and bonuses on known stats. */
export const roomTable = (items: readonly RoomDef[]): ContentTable =>
  defineTable({
    domain: 'rooms',
    items,
    textFields: ['name', 'description'],
    check: (room) => [
      ...(isTier(room.buy.level) && room.buy.level >= 2 && room.buy.level <= REPUTATION_LEVELS.length
        ? [] : [`buy.level must be a level from 2 to ${REPUTATION_LEVELS.length}`]),
      ...positive(room.buy.cost, 'buy.cost'),
      ...(Number.isInteger(room.seats) && room.seats >= 0 ? [] : ['seats must be a whole number >= 0']),
      ...(room.seats > 0 || room.effects.length > 0 ? [] : ['a room must add seats or an effect']),
      ...room.effects.flatMap((e) => [...oneOf(e.stat, UPGRADE_STATS, 'effect stat'), ...positive(e.perLevel, 'effect perLevel')]),
    ],
  });

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
