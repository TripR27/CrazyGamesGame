const ID_PATTERN = /^[a-z][a-z0-9_]*$/;

export const isValidId = (id: string): boolean => ID_PATTERN.test(id);
export const isPositive = (n: number): boolean => Number.isFinite(n) && n > 0;
export const isTier = (n: number): boolean => Number.isInteger(n) && n >= 1;

export function oneOf(value: string, allowed: readonly string[], label: string): string[] {
  return allowed.includes(value) ? [] : [`${label} "${value}" is not one of ${allowed.join(', ')}`];
}

export function positive(n: number, label: string): string[] {
  return isPositive(n) ? [] : [`${label} must be a positive number, got ${n}`];
}

export function duplicates(values: readonly string[]): string[] {
  return values.filter((v, i) => values.indexOf(v) !== i);
}
