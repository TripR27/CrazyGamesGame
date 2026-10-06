import type { BrewStation } from './types';

export function createStation(capacity: number): BrewStation {
  return { contents: [], brewing: null, ready: [], capacity };
}

/** Throw away what is in the cauldron (not while brewing). Returns true when something was removed. */
export function emptyCauldron(station: BrewStation): boolean {
  if (station.brewing !== null || station.contents.length === 0) return false;
  station.contents = [];
  return true;
}
