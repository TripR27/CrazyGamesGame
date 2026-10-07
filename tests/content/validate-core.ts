import { CONTENT_TABLES } from './validate-content';
import type { CustomerDef } from '@/customers/customer-data';
import type { UpgradeDef } from '@/economy/upgrade-data';
import type { RecipeDef } from '@/recipes/recipe-data';
import { REPUTATION_LEVELS } from '@/reputation/reputation';
import { type ContentDomain, EFFECTS, RARITIES, textKey } from '@/shared/content';
import type { FeedbackPool } from '@/shared/random';

export interface CheckContext {
  /** True when `id` exists in the given content domain. */
  has(domain: ContentDomain, id: string): boolean;
}

export interface TableEntry {
  id: string;
  /** i18n fields this item needs, e.g. `name`. */
  textFields: readonly string[];
  /** Rules specific to this one item. */
  check(ctx: CheckContext): string[];
}

/** A content list plus its own rules; the validator only knows this shape. */
export interface ContentTable {
  domain: ContentDomain;
  entries: readonly TableEntry[];
  /** Rules that span the whole list, e.g. "no two recipes share a combination". */
  checkSet(): string[];
}

export interface TableSpec<T extends { id: string }> {
  domain: ContentDomain;
  items: readonly T[];
  /** The same fields for every item, or a function when items differ (e.g. pools with N lines). */
  textFields: readonly string[] | ((item: T) => readonly string[]);
  check(item: T, ctx: CheckContext): string[];
  checkSet?(items: readonly T[]): string[];
}

/** Erases the item type so tables of different shapes fit in one list (open for new domains). */
export function defineTable<T extends { id: string }>(spec: TableSpec<T>): ContentTable {
  const fieldsFor = (item: T): readonly string[] =>
    typeof spec.textFields === 'function' ? spec.textFields(item) : spec.textFields;
  return {
    domain: spec.domain,
    entries: spec.items.map((item) => ({
      id: item.id,
      textFields: fieldsFor(item),
      check: (ctx) => spec.check(item, ctx).map((m) => `${spec.domain}.${item.id}: ${m}`),
    })),
    checkSet: () => spec.checkSet?.(spec.items) ?? [],
  };
}

const ID_PATTERN = /^[a-z][a-z0-9_]*$/;

export const isValidId = (id: string): boolean => ID_PATTERN.test(id);
export const isPositive = (n: number): boolean => Number.isFinite(n) && n > 0;
export const isTier = (n: number): boolean => Number.isInteger(n) && n >= 1;
export const tierRule = (tier: number): string[] =>
  isTier(tier) ? [] : [`tier must be a whole number >= 1, got ${tier}`];

export function oneOf(value: string, allowed: readonly string[], label: string): string[] {
  return allowed.includes(value) ? [] : [`${label} "${value}" is not one of ${allowed.join(', ')}`];
}

export function positive(n: number, label: string): string[] {
  return isPositive(n) ? [] : [`${label} must be a positive number, got ${n}`];
}

export function duplicates(values: readonly string[]): string[] {
  return values.filter((v, i) => values.indexOf(v) !== i);
}

const comboKey = (ids: readonly string[]): string => [...ids].sort().join('+');
const isSubset = (small: readonly string[], big: readonly string[]): boolean =>
  small.every((id) => big.includes(id));

/** The table factories take items so tests can feed them deliberately broken data. */
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

export { CONTENT_TABLES };

function checkTable(table: ContentTable, ctx: CheckContext, hasKey: (key: string) => boolean): string[] {
  const ids = table.entries.map((e) => e.id);
  return [
    ...duplicates(ids).map((id) => `${table.domain}.${id}: id is used more than once`),
    ...ids.filter((id) => !isValidId(id)).map((id) => `${table.domain}.${id}: id must be snake_case`),
    ...table.entries.flatMap((entry) =>
      entry.textFields
        .map((field) => textKey(table.domain, entry.id, field))
        .filter((key) => !hasKey(key))
        .map((key) => `missing translation key ${key}`),
    ),
    ...table.entries.flatMap((entry) => entry.check(ctx)),
    ...table.checkSet().map((m) => `${table.domain}: ${m}`),
  ];
}

/**
 * Returns every problem found in the content tables (empty = valid).
 * `hasKey` is injected so data stays independent of the i18n layer.
 */
export function validateContent(
  hasKey: (key: string) => boolean,
  tables: readonly ContentTable[] = CONTENT_TABLES,
): string[] {
  const ctx: CheckContext = {
    has: (domain, id) =>
      tables.some((t) => t.domain === domain && t.entries.some((e) => e.id === id)),
  };
  return tables.flatMap((table) => checkTable(table, ctx, hasKey));
}
