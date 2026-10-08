import { type ContentTable, customerTable, feedbackTable, recipeTable, upgradeTable, isTier, oneOf, positive, tierRule, defineTable } from './validate-core';
import { ingredients, type IngredientDef } from '@/brewing/ingredients';
import { customers } from '@/customers/customer-data';
import { DECORATIONS, type DecorDef } from '@/decor/decor';
import { upgrades, UPGRADE_STATS, type UpgradeEffect } from '@/economy/upgrade-data';
import { GEAR, GEAR_SLOTS, type GearDef } from '@/heroes/gear';
import { DUNGEONS, type DungeonDef } from '@/heroes/expedition';
import { CARDS, type CardDef } from '@/heroes/trip-cards';
import { HERO_CLASSES, type HeroClassDef } from '@/heroes/heroes';
import { recipes } from '@/recipes/recipe-data';
import { REPUTATION_LEVELS, type ReputationLevel } from '@/reputation/reputation';
import { GUILD_ROOM_ID, ROOMS, type RoomDef } from '@/rooms/rooms';
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

/** A one-time purchase (room, decoration) opens at a level after the first and costs gold. */
const oneTimeRule = (buy: { level: number; cost: number }): string[] => [
  ...(isTier(buy.level) && buy.level >= 2 && buy.level <= REPUTATION_LEVELS.length
    ? [] : [`buy.level must be a level from 2 to ${REPUTATION_LEVELS.length}`]),
  ...positive(buy.cost, 'buy.cost'),
];

const effectRule = (e: UpgradeEffect): string[] => [...oneOf(e.stat, UPGRADE_STATS, 'effect stat'), ...positive(e.perLevel, 'effect perLevel')];

/** Rooms open at a level after the first, cost gold, have a whole number of seats and bonuses on known stats. */
export const roomTable = (items: readonly RoomDef[]): ContentTable =>
  defineTable({
    domain: 'rooms',
    items,
    textFields: ['name', 'description'],
    check: (room) => [
      ...oneTimeRule(room.buy),
      ...(Number.isInteger(room.seats) && room.seats >= 0 ? [] : ['seats must be a whole number >= 0']),
      // The guild hall's use is its heroes.
      ...(room.seats > 0 || room.effects.length > 0 || room.id === GUILD_ROOM_ID ? [] : ['a room must add seats or an effect']),
      ...room.effects.flatMap(effectRule),
    ],
  });

/** Decorations open at a level after the first, cost gold and give at least one bonus on a known stat. */
export const decorTable = (items: readonly DecorDef[]): ContentTable =>
  defineTable({
    domain: 'decor',
    items,
    textFields: ['name', 'description'],
    check: (def) => [
      ...oneTimeRule(def.buy),
      ...(def.effects.length > 0 ? [] : ['a decoration must give a bonus']),
      ...def.effects.flatMap(effectRule),
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

/** A hero class is hired for gold, or comes with the guild hall. */
export const heroClassTable = (items: readonly HeroClassDef[]): ContentTable =>
  defineTable({
    domain: 'heroes',
    items,
    textFields: ['name', 'class', 'tagline'],
    check: (hero) => (hero.hire === 'withGuildRoom' ? [] : positive(hero.hire.cost, 'hire.cost')),
  });

/** A trip takes 1 to 3 minutes, gives XP and rolls loot from drops with positive weights and whole amounts. */
export const dungeonTable = (items: readonly DungeonDef[]): ContentTable =>
  defineTable({
    domain: 'dungeons',
    items,
    textFields: ['name', 'description'],
    check: (d) => [
      ...(d.durationSeconds >= 60 && d.durationSeconds <= 180 ? [] : ['durationSeconds must be from 60 to 180']),
      ...positive(d.xp, 'xp'),
      ...(Number.isInteger(d.lootRolls) && d.lootRolls >= 1 ? [] : ['lootRolls must be a whole number >= 1']),
      ...(d.drops.length > 0 ? [] : ['needs at least one drop']),
      ...d.drops.flatMap((drop) => [...positive(drop.weight, 'drop weight'), ...(Number.isInteger(drop.amount) && drop.amount >= 1 ? [] : ['drop amount must be a whole number >= 1'])]),
      ...(d.gearChance >= 0 && d.gearChance <= 1 ? [] : ['gearChance must be from 0 to 1']),
      ...d.gearDrops.flatMap((drop) => [
        ...positive(drop.weight, 'gear drop weight'),
        ...(GEAR.some((g) => g.id === drop.gear && g.buy === undefined) ? [] : [`gear drop "${drop.gear}" must be loot-only gear`]),
      ]),
    ],
  });

/** Gear sits in a known slot, does something (a shield or helmet less than all of it) and, when sold, costs gold. */
export const gearTable = (items: readonly GearDef[]): ContentTable =>
  defineTable({
    domain: 'gear',
    items,
    textFields: ['name'],
    check: (g) => [
      ...oneOf(g.slot, GEAR_SLOTS, 'slot'),
      ...positive(g.power, 'power'),
      ...((g.slot === 'shield' || g.slot === 'helmet') && g.power >= 1 ? ['power of a shield or helmet must stay below 1'] : []),
      ...(g.buy === undefined ? [] : positive(g.buy.cost, 'buy.cost')),
    ],
  });

/** A card has a title, a line and a text per option, and exactly one safe default that needs no drink. */
export const cardTable = (items: readonly CardDef[]): ContentTable =>
  defineTable({
    domain: 'cards',
    items,
    textFields: (card) => ['title', 'text', ...card.options.map((o) => o.id)],
    check: (card) => {
      const defaults = card.options.filter((o) => o.default === true);
      return [
        ...(defaults.length === 1 ? [] : ['needs exactly one default option']),
        ...(defaults.some((o) => o.needsDrink === true) ? ['the default option must not need a drink'] : []),
        ...(card.options.length >= 2 ? [] : ['needs at least two options']),
      ];
    },
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
  decorTable(DECORATIONS),
  heroClassTable(HERO_CLASSES),
  dungeonTable(DUNGEONS),
  gearTable(GEAR),
  cardTable(CARDS),
];
