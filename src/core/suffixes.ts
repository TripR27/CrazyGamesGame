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
