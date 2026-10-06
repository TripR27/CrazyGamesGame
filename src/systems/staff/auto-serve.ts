import type { BrewStation } from '@/systems/brewing';

/** The oldest waiting customer whose drink is ready on the bar: who the waitress serves next. */
export function readyCustomer(
  waiting: readonly { id: number; recipeId: string }[],
  station: BrewStation,
): number | undefined {
  return waiting.find((c) => station.ready.includes(c.recipeId))?.id;
}
