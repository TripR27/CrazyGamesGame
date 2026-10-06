import { describe, expect, it } from 'vitest';
import { num } from '@/core/numbers';
import type { OfflineReport } from '@/systems/offline';
import { formatDuration, toWelcomeView } from '@/ui/welcome/welcome-view-model';

const report = (over: Partial<OfflineReport> = {}): OfflineReport => ({
  awayMs: 3_600_000, countedMs: 3_600_000, capped: false, limitHours: 2, hadStaff: true, served: 90, gold: num(1800), reputation: 90, ...over,
});

describe('formatDuration', () => {
  it('shows the two biggest units that are not zero', () => {
    expect(formatDuration(3_600_000 + 23 * 60_000 + 5000)).toBe('1h 23m');
    expect(formatDuration(45 * 60_000)).toBe('45m');
    expect(formatDuration(2 * 3_600_000)).toBe('2h');
    expect(formatDuration(50_000)).toBe('50s');
  });
});

describe('welcome-back window', () => {
  it('lists the time away, the customers served and the gold earned', () => {
    const view = toWelcomeView(report());
    expect(view.title).toBe('Welcome back!');
    expect(view.lines).toEqual(['You were away for 1h.', 'Customers served: 90', 'Gold earned: 1.8K']);
  });

  it('tells a player without a full crew what to do', () => {
    const view = toWelcomeView(report({ served: 0, hadStaff: false, gold: num(0) }));
    expect(view.lines[1]).toMatch(/Hire a brewer and a waitress/);
  });

  it('says when the staff stopped working before the player came back', () => {
    const view = toWelcomeView(report({ awayMs: 5 * 3_600_000, countedMs: 2 * 3_600_000, capped: true }));
    expect(view.lines.at(-1)).toBe('Staff stop working after 2h away.');
  });
});
