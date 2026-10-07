import type { UpgradeDef } from '@/data/upgrades/types';

/**
 * Staff and seats each have their own tutorial hint; every other upgrade belongs to the first-upgrade hint.
 * A new hint group is one more function here plus an event name in `AffordableEvent`.
 */
const isStaff = (d: UpgradeDef): boolean => d.kind === 'staff';
const isSeats = (d: UpgradeDef): boolean => d.effect.stat === 'seats';

export const staffOnly = (defs: readonly UpgradeDef[]): UpgradeDef[] => defs.filter(isStaff);
export const seatsOnly = (defs: readonly UpgradeDef[]): UpgradeDef[] => defs.filter(isSeats);
export const generalOnly = (defs: readonly UpgradeDef[]): UpgradeDef[] => defs.filter((d) => !isStaff(d) && !isSeats(d));
