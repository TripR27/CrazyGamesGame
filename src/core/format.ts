import type { Num } from '@/core/numbers';
import { suffixForGroup } from '@/core/suffixes';

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
