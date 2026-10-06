import { describe, expect, it, vi } from 'vitest';
import { createInitialState } from '@/core/state';
import type { OfflineReport } from '@/systems/offline';
import { newGame } from './helpers';

const HOUR = 3_600_000;
const STAFFED = { brewer_assistant: 1, waitress: 1 };

function away(hours: number, upgrades: Record<string, number> = STAFFED) {
  const state = createInitialState(0);
  state.upgrades = upgrades;
  const game = newGame(state);
  const reports: OfflineReport[] = [];
  game.world.offline.inbox.subscribe((r) => reports.push(r));
  game.world.offline.handleAway(hours * HOUR);
  return { ...game, reports };
}

describe('coming back after being away', () => {
  it('pays what the hired staff earned and shows the welcome window', () => {
    const { state, reports, saves } = away(1);
    expect(state.currencies.gold.gt(0)).toBe(true);
    expect(state.reputation).toBeGreaterThan(0);
    expect(reports).toHaveLength(1);
    expect(reports[0]?.served).toBeGreaterThan(0);
    expect(saves).toHaveBeenCalled();
  });

  it('earns nothing without staff but still welcomes the player back', () => {
    const { state, reports } = away(1, {});
    expect(state.currencies.gold.toNumber()).toBe(0);
    expect(reports[0]).toMatchObject({ served: 0, hadStaff: false });
  });

  it('stops counting at the two hour limit', () => {
    const two = away(2).state.currencies.gold;
    expect(away(24).state.currencies.gold.eq(two)).toBe(true);
  });

  it('counts a short gap silently: gold, but no welcome window', () => {
    const state = createInitialState(0);
    state.upgrades = STAFFED;
    const game = newGame(state);
    const posted = vi.fn();
    game.world.offline.inbox.subscribe(posted);
    game.world.offline.handleAway(30_000);
    expect(posted).not.toHaveBeenCalled();
    game.world.offline.handleAway(30 * 60_000);
    expect(posted).toHaveBeenCalledTimes(1);
  });

  it('marks the time as counted so the same gap is not paid twice', () => {
    const { state } = away(1);
    expect(state.meta.lastSeenAt).toBeGreaterThan(0);
  });

  it('ignores a gap of zero or less', () => {
    const { state, reports } = away(0);
    expect(state.currencies.gold.toNumber()).toBe(0);
    expect(reports).toEqual([]);
  });
});
