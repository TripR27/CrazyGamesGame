import { num, type Num } from '@/core/numbers';
import type { UpgradeLevels } from '@/core/state';
import { BASE_STATS, upgrades, type UpgradeDef, type UpgradeStat } from '@/data/upgrades';
import { levelOf } from '@/systems/upgrades/level';

/** The final value of every stat: what the rest of the game reads. */
export type Multipliers = Record<UpgradeStat, Num>;

/** The part of the state the multipliers depend on (interface segregation). */
export interface MultiplierState {
  upgrades: UpgradeLevels;
}

/** Added amounts count first, then factors, so the order of upgrades never changes the result. */
function applyUpgrades(stat: UpgradeStat, levels: UpgradeLevels, defs: readonly UpgradeDef[]): Num {
  const own = defs.filter((d) => d.effect.stat === stat);
  let value = num(BASE_STATS[stat]);
  for (const def of own.filter((d) => d.effect.mode === 'add')) {
    value = value.add(def.effect.perLevel * levelOf(levels, def));
  }
  for (const def of own.filter((d) => d.effect.mode === 'multiply')) {
    value = value.mul(num(1 + def.effect.perLevel).pow(levelOf(levels, def)));
  }
  return value;
}

/**
 * The one place where every source of a bonus is added up. Today that is only upgrades;
 * prestige, achievements and events join here later without the callers changing.
 */
export function getMultipliers(state: MultiplierState, defs: readonly UpgradeDef[] = upgrades): Multipliers {
  const stat = (s: UpgradeStat): Num => applyUpgrades(s, state.upgrades, defs);
  return { brewSpeed: stat('brewSpeed'), sellPrice: stat('sellPrice'), storage: stat('storage') };
}
