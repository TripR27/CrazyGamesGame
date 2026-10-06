import type { ContentDomain } from '@/data/text-key';

export interface CheckContext {
  /** True when `id` exists in the given content domain. */
  has(domain: ContentDomain, id: string): boolean;
}

export interface TableEntry {
  id: string;
  /** Rules specific to this one item. */
  check(ctx: CheckContext): string[];
}

/** A content list plus its own rules; the validator only knows this shape. */
export interface ContentTable {
  domain: ContentDomain;
  /** i18n fields every item must have, e.g. `name`. */
  textFields: readonly string[];
  entries: readonly TableEntry[];
  /** Rules that span the whole list, e.g. "no two recipes share a combination". */
  checkSet(): string[];
}

export interface TableSpec<T extends { id: string }> {
  domain: ContentDomain;
  items: readonly T[];
  textFields: readonly string[];
  check(item: T, ctx: CheckContext): string[];
  checkSet?(items: readonly T[]): string[];
}

/** Erases the item type so tables of different shapes fit in one list (open for new domains). */
export function defineTable<T extends { id: string }>(spec: TableSpec<T>): ContentTable {
  return {
    domain: spec.domain,
    textFields: spec.textFields,
    entries: spec.items.map((item) => ({
      id: item.id,
      check: (ctx) => spec.check(item, ctx).map((m) => `${spec.domain}.${item.id}: ${m}`),
    })),
    checkSet: () => spec.checkSet?.(spec.items) ?? [],
  };
}
