import Decimal from 'break_infinity.js';

export type Num = Decimal;
export type NumSource = Decimal | number | string;

export const num = (value: NumSource): Num => new Decimal(value);

export const ZERO: Num = num(0);
export const ONE: Num = num(1);

export const serializeNum = (value: Num): string => value.toString();

export const parseNum = (text: string): Num => Decimal.fromString(text);

const NAMED = ['', 'K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc', 'No', 'Dc'];
const LETTERS = 'abcdefghijklmnopqrstuvwxyz';
const LETTER_PAIRS = LETTERS.length * LETTERS.length;

export const MAX_SUFFIX_GROUP = NAMED.length + LETTER_PAIRS - 1;

/** Suffix for a power-of-1000 group (0 = none, 1 = K, ... 12 = aa), or null when out of range. */
export function suffixForGroup(group: number): string | null {
  if (group < 0 || group > MAX_SUFFIX_GROUP) return null;
  const named = NAMED[group];
  if (named !== undefined) return named;
  const index = group - NAMED.length;
  return LETTERS.charAt(Math.floor(index / LETTERS.length)) + LETTERS.charAt(index % LETTERS.length);
}

const DECIMALS = 2;
const THOUSAND = 1000;

const round = (n: number): number => Number(n.toFixed(DECIMALS));
const trim = (n: number): string => round(n).toString();

function scientific(value: Num): string {
  return `${value.m.toFixed(DECIMALS)}e${value.e}`;
}

function formatLarge(value: Num): string {
  let group = Math.floor(value.e / 3);
  let mantissa = value.m * 10 ** (value.e - group * 3);
  if (round(mantissa) >= THOUSAND) {
    group += 1;
    mantissa /= THOUSAND;
  }
  const suffix = suffixForGroup(group);
  return suffix === null ? scientific(value) : `${trim(mantissa)}${suffix}`;
}

/** Idle-game notation: 999, 1.5K, 2.5B, 1aa, and scientific beyond the suffix table. */
export function formatNumber(value: Num): string {
  if (value.lt(0)) return `-${formatNumber(value.abs())}`;
  if (value.lt(THOUSAND) && round(value.toNumber()) < THOUSAND) return trim(value.toNumber());
  return formatLarge(value);
}
