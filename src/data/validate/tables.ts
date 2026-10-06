import { EFFECTS, RARITIES } from '@/data/common';
import type { FeedbackPool } from '@/data/feedback';
import type { CustomerDef } from '@/data/customers';
import type { IngredientDef } from '@/data/ingredients';
import type { RecipeDef } from '@/data/recipes';
import { REPUTATION_LEVELS } from '@/data/reputation/levels';
import type { UpgradeDef } from '@/data/upgrades';
import { duplicates, isTier, oneOf, positive } from './rules';
import { defineTable, type ContentTable } from './table';

const SOURCE_PATTERN = /^(shop|dungeon:[a-z][a-z0-9_]*)$/;
const comboKey = (ids: readonly string[]): string => [...ids].sort().join('+');
const isSubset = (small: readonly string[], big: readonly string[]): boolean =>
  small.every((id) => big.includes(id));
const tierRule = (tier: number): string[] =>
  isTier(tier) ? [] : [`tier must be a whole number >= 1, got ${tier}`];

/** The table factories take items so tests can feed them deliberately broken data. */
export const ingredientTable = (items: readonly IngredientDef[]): ContentTable =>
  defineTable({
    domain: 'ingredients',
    items,
    textFields: ['name'],
    check: (i) => [
      ...tierRule(i.tier),
      ...oneOf(i.rarity, RARITIES, 'rarity'),
      ...(SOURCE_PATTERN.test(i.source) ? [] : [`source "${i.source}" must be shop or dungeon:<id>`]),
    ],
  });

export const recipeTable = (items: readonly RecipeDef[]): ContentTable =>
  defineTable({
    domain: 'recipes',
    items,
    textFields: ['name', 'hint'],
    check: (r, ctx) => [
      ...tierRule(r.tier),
      ...oneOf(r.rarity, RARITIES, 'rarity'),
      ...oneOf(r.effect, EFFECTS, 'effect'),
      ...positive(r.brewSeconds, 'brewSeconds'),
      ...positive(r.basePrice, 'basePrice'),
      ...(r.ingredients.length >= 2 && r.ingredients.length <= 3 ? [] : ['needs 2 or 3 ingredients']),
      ...duplicates(r.ingredients).map((d) => `ingredient "${d}" is listed twice`),
      ...r.ingredients
        .filter((id) => !ctx.has('ingredients', id))
        .map((id) => `unknown ingredient "${id}"`),
    ],
    checkSet: (all) => [
      ...duplicates(all.map((r) => comboKey(r.ingredients))).map(
        (combo) => `two recipes share the combination ${combo}`,
      ),
      // Brewing starts as soon as the cauldron matches a recipe, so a recipe inside a bigger one could never be finished.
      ...all.flatMap((a) =>
        all
          .filter((b) => a.id !== b.id && a.ingredients.length < b.ingredients.length)
          .filter((b) => isSubset(a.ingredients, b.ingredients))
          .map((b) => `recipe ${a.id} is a part of recipe ${b.id}`),
      ),
    ],
  });

export const customerTable = (items: readonly CustomerDef[]): ContentTable =>
  defineTable({
    domain: 'customers',
    items,
    textFields: ['name', 'tagline'],
    check: (c) => [
      ...(isTier(c.minLevel) && c.minLevel <= REPUTATION_LEVELS.length ? [] : [`minLevel must be a level from 1 to ${REPUTATION_LEVELS.length}`]),
      ...((c.reputationBonus ?? 0) >= 0 ? [] : ['reputationBonus must be >= 0']),
      ...positive(c.patienceSeconds, 'patienceSeconds'),
      ...positive(c.spendMultiplier, 'spendMultiplier'),
      ...c.likes.flatMap((effect) => oneOf(effect, EFFECTS, 'liked effect')),
    ],
  });

export const upgradeTable = (items: readonly UpgradeDef[]): ContentTable =>
  defineTable({
    domain: 'upgrades',
    items,
    textFields: ['name', 'description'],
    check: (u) => [
      ...positive(u.baseCost, 'baseCost'),
      ...positive(u.effect.perLevel, 'effect.perLevel'),
      ...(u.growth > 1 ? [] : [`growth must be > 1, got ${u.growth}`]),
      ...(u.maxLevel === undefined || isTier(u.maxLevel) ? [] : ['maxLevel must be a whole number >= 1']),
    ],
  });

export const feedbackTable = (items: readonly FeedbackPool[]): ContentTable =>
  defineTable({
    domain: 'feedback',
    items,
    textFields: (pool) => Array.from({ length: pool.lines }, (_, i) => String(i + 1)),
    check: (pool) => positive(pool.lines, 'lines'),
  });
