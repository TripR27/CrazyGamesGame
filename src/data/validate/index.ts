import { CONTENT_TABLES } from '@/data/validate/content-tables';
import { duplicates, isValidId } from '@/data/validate/rules';
import type { CheckContext, ContentTable } from '@/data/validate/table';
import { textKey } from '@/shared/content';

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
