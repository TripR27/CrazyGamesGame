import type { UpgradeDef } from '@/data/upgrades';

/** Staff upgrades have their own tutorial hint; everything else belongs to the first-upgrade hint. */
export const staffOnly = (defs: readonly UpgradeDef[]): UpgradeDef[] => defs.filter((d) => d.kind === 'staff');
export const withoutStaff = (defs: readonly UpgradeDef[]): UpgradeDef[] => defs.filter((d) => d.kind !== 'staff');
