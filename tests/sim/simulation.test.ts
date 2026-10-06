import { describe, expect, it } from 'vitest';
import { formatIdleShare, formatRun, runSimulation, type SimOptions } from '@/sim';
import { clockTime } from '@/sim/report';

const short: SimOptions = { minutes: 3, seed: 1, actionMs: 700, bot: { buys: true } };

describe('the balance simulator', () => {
  it('plays the real game: serves, buys, levels up and discovers within a few minutes', () => {
    const { timeline, snapshots } = runSimulation(short);
    const texts = timeline.entries.map((e) => e.text);
    expect(texts).toContain('first customer served');
    expect(texts.some((t) => t.startsWith('first Swift Cauldron'))).toBe(true);
    expect(texts.some((t) => t.startsWith('discovered'))).toBe(true);
    expect(timeline.purchases.length).toBeGreaterThan(0);
    expect(snapshots.map((s) => s.minute)).toEqual([1, 2]);
  });

  it('is repeatable: the same seed gives the same run', () => {
    const a = runSimulation(short);
    const b = runSimulation(short);
    expect(b.timeline.entries).toEqual(a.timeline.entries);
    expect(b.timeline.purchases).toEqual(a.timeline.purchases);
  });

  it('stops all player actions once the player walks away; only staff can still earn', () => {
    const idle = runSimulation({ ...short, idleFromMinute: 0 });
    expect(idle.timeline.purchases).toEqual([]);
    expect(idle.timeline.earned).toEqual([]);
  });

  it('prints a timeline, a table and the pacing goals', () => {
    const result = runSimulation(short);
    const lines = formatRun(result, 'Test run');
    expect(lines[0]).toBe('== Test run (seed 1, one click every 700 ms) ==');
    expect(lines.some((l) => l.includes('purchases in the first 5 min'))).toBe(true);
    expect(formatIdleShare(result, runSimulation({ ...short, idleFromMinute: 0 }), 0, 3)).toContain('idle earns 0%');
  });

  it('writes times as minutes and seconds', () => {
    expect(clockTime(0)).toBe('0:00');
    expect(clockTime(65_400)).toBe('1:05');
  });
});
