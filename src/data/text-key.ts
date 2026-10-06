export type ContentDomain = 'ingredients' | 'recipes' | 'customers' | 'upgrades' | 'feedback' | 'tutorial' | 'reputation';

/** Content data holds ids only; every visible string lives in i18n under `domain.id.field`. */
export function textKey(domain: ContentDomain, id: string, field: string): string {
  return `${domain}.${id}.${field}`;
}
