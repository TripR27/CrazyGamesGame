import { BASE_STATS } from '@/data/upgrades/base-stats';
import { upgrades } from '@/data/upgrades/index';
import { UPGRADE_STATS, type UpgradeDef, type UpgradeEffect, type UpgradeStat } from '@/data/upgrades/types';
import { ROOMS, type RoomDef } from '@/rooms/rooms';
import { num, type Num } from '@/shared/numbers';
import type { UpgradeLevels } from '@/shared/state';
import { levelOf } from '@/systems/upgrades/level';

/** The final value of every stat: what the rest of the game reads. */
export type Multipliers = Record<UpgradeStat, Num>;

/** The part of the state the multipliers depend on (interface segregation). */
export interface MultiplierState {
  upgrades: UpgradeLevels;
  /** Built rooms; left out means none. */
  roomsBuilt?: readonly string[];
}

/** One bonus and how many times it counts (an upgrade's level, or 1 for a built room). */
interface Source {
  effect: UpgradeEffect;
  times: number;
}

/** Added amounts count first, then factors, so the order of the sources never changes the result. */
function applySources(stat: UpgradeStat, sources: readonly Source[]): Num {
  const own = sources.filter((s) => s.effect.stat === stat);
  let value = num(BASE_STATS[stat]);
  for (const s of own.filter((o) => o.effect.mode === 'add')) value = value.add(s.effect.perLevel * s.times);
  for (const s of own.filter((o) => o.effect.mode === 'multiply')) value = value.mul(num(1 + s.effect.perLevel).pow(s.times));
  return value;
}

/**
 * The one place where every source of a bonus is added up: upgrades and built rooms; prestige, achievements and
 * events join here later without the callers changing.
 */
export function getMultipliers(
  state: MultiplierState,
  defs: readonly UpgradeDef[] = upgrades,
  rooms: readonly RoomDef[] = ROOMS,
): Multipliers {
  const built = rooms.filter((r) => (state.roomsBuilt ?? []).includes(r.id));
  const sources: Source[] = [
    ...defs.map((def) => ({ effect: def.effect, times: levelOf(state.upgrades, def) })),
    ...built.flatMap((room) => room.effects.map((effect) => ({ effect, times: 1 }))),
  ];
  const entries = UPGRADE_STATS.map((stat) => [stat, applySources(stat, sources)] as const);
  return Object.fromEntries(entries) as Multipliers;
}
