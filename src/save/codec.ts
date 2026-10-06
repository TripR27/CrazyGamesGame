import Decimal from 'break_infinity.js';
import { parseNum } from '@/core/numbers';

const NUM_TAG = '$num';

type TaggedNum = { [NUM_TAG]: string };

function isTaggedNum(value: unknown): value is TaggedNum {
  if (typeof value !== 'object' || value === null) return false;
  const keys = Object.keys(value);
  return keys.length === 1 && keys[0] === NUM_TAG && typeof (value as TaggedNum)[NUM_TAG] === 'string';
}

/** JSON-encode any state; Decimal values become tagged strings, so new state slices need no extra code. */
export function encode(value: unknown): string {
  return JSON.stringify(value, function (this: Record<string, unknown>, key: string, json: unknown) {
    const original = this[key];
    return original instanceof Decimal ? { [NUM_TAG]: original.toString() } : json;
  });
}

export function decode(text: string): unknown {
  return JSON.parse(text, (_key, value: unknown) => (isTaggedNum(value) ? parseNum(value[NUM_TAG]) : value));
}
