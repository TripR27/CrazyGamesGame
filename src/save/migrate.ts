import { SaveError } from '@/save/errors';

export const CURRENT_SAVE_VERSION = 1;

export type RawState = Record<string, unknown>;
export type Migration = (state: RawState) => RawState;

/** Migrations keyed by the version they upgrade FROM (key 1 upgrades version 1 to 2). */
export const MIGRATIONS: Readonly<Record<number, Migration>> = {};

export function migrateState(
  version: number,
  state: RawState,
  migrations: Readonly<Record<number, Migration>> = MIGRATIONS,
  target: number = CURRENT_SAVE_VERSION,
): RawState {
  if (!Number.isInteger(version) || version < 1) {
    throw new SaveError('corrupt', `Invalid save version: ${version}`);
  }
  if (version > target) {
    throw new SaveError('too-new', `Save version ${version} is newer than ${target}`);
  }
  let current = state;
  for (let from = version; from < target; from += 1) {
    const migration = migrations[from];
    if (migration === undefined) throw new SaveError('corrupt', `No migration from version ${from}`);
    current = migration(current);
  }
  return current;
}
