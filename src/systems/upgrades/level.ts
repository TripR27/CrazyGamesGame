import type { UpgradeLevels } from '@/core/state';
import type { UpgradeDef } from '@/data/upgrades';

/** Owned level of an upgrade; never above its max, even if an old save or a content change says so. */
export function levelOf(levels: UpgradeLevels, def: UpgradeDef): number {
  const owned = Math.max(0, Math.floor(levels[def.id] ?? 0));
  return def.maxLevel === undefined ? owned : Math.min(owned, def.maxLevel);
}

/** Levels still to buy: Infinity when there is no cap. */
export function levelsLeft(levels: UpgradeLevels, def: UpgradeDef): number {
  return def.maxLevel === undefined ? Infinity : def.maxLevel - levelOf(levels, def);
}
