import Decimal from 'break_infinity.js';

type Plain = Record<string, unknown>;

const isPlain = (value: unknown): value is Plain =>
  typeof value === 'object' && value !== null && !Array.isArray(value) && !(value instanceof Decimal);

function reconcilePlain(defaults: Plain, saved: unknown): Plain {
  if (!isPlain(saved)) return defaults;
  // An empty object in the defaults is an open-ended map (e.g. upgrade levels): keep saved entries as they are.
  if (Object.keys(defaults).length === 0) return saved;
  const result: Plain = {};
  for (const key of Object.keys(defaults)) result[key] = reconcile(defaults[key], saved[key]);
  return result;
}

/**
 * Merge a loaded save into the defaults: missing fields get defaults, unknown fields are dropped,
 * and values of the wrong type fall back to the default. Makes new fields safe to add.
 */
export function reconcile<T>(defaults: T, saved: unknown): T {
  if (isPlain(defaults)) return reconcilePlain(defaults, saved) as T;
  if (defaults instanceof Decimal) return (saved instanceof Decimal ? saved : defaults) as T;
  if (Array.isArray(defaults)) return (Array.isArray(saved) ? saved : defaults) as T;
  if (defaults === null) return saved as T;
  return (typeof saved === typeof defaults ? saved : defaults) as T;
}
