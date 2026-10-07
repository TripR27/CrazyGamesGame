import { type SimResult, earnedBetween, runSimulation, type SimOptions } from '@/dev/simulator';
import { formatNumber } from '@/shared/numbers';

const MINUTE_MS = 60_000;

/** "12:05" for a simulated time. */
export function clockTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const seconds = String(totalSeconds % 60).padStart(2, '0');
  return `${Math.floor(totalSeconds / 60)}:${seconds}`;
}

const pad = (text: string | number, width: number): string => String(text).padStart(width);

/** Pacing goals from GAME_ANALYSE.md chapter 6, next to what the run did. */
function goals(result: SimResult): string[] {
  const within = (minutes: number): number => result.timeline.purchases.filter((ms) => ms < minutes * MINUTE_MS).length;
  const first = (prefix: string): string => {
    const entry = result.timeline.entries.find((e) => e.text.startsWith(prefix));
    return entry === undefined ? 'never' : clockTime(entry.ms);
  };
  return [
    `  purchases in the first 5 min: ${within(5)} (goal ~10)`,
    `  first staff member hired at: ${first('first Brewer')} / ${first('first Waitress')} (goal: within 5 min)`,
    `  first new recipe discovered at: ${first('discovered')} (goal: within 5 min)`,
  ];
}

/** The run as plain text: a timeline of firsts, snapshots per minute, and the pacing goals. */
export function formatRun(result: SimResult, title: string): string[] {
  const { timeline, snapshots } = result;
  return [
    `== ${title} (seed ${result.options.seed}, one click every ${result.options.actionMs} ms) ==`,
    ...timeline.entries.map((e) => `  ${pad(clockTime(e.ms), 6)}  ${e.text}`),
    '',
    '  minute |     gold | rep | lvl | recipes | seats | staff/s (brew/serve)',
    ...snapshots.map(
      (s) =>
        `  ${pad(s.minute, 6)} | ${pad(formatNumber(s.gold), 8)} | ${pad(s.reputation, 3)} | ${pad(s.level, 3)} | ` +
        `${pad(s.recipes, 7)} | ${pad(s.seats, 5)} | ${s.staff}`,
    ),
    '',
    ...goals(result),
  ];
}

/** Idle income (staff only) as a share of active play over the same window. GAME_ANALYSE.md aims at 30-40%. */
export function formatIdleShare(active: SimResult, idle: SimResult, fromMinute: number, toMinute: number): string {
  const window = (r: SimResult) => earnedBetween(r.timeline, fromMinute * MINUTE_MS, toMinute * MINUTE_MS);
  const activeGold = window(active);
  const share = activeGold.gt(0) ? window(idle).div(activeGold).toNumber() : 0;
  return `  idle earns ${Math.round(share * 100)}% of active play in minutes ${fromMinute}-${toMinute} (goal 30-40%)`;
}

export interface ReportOptions {
  minutes: number;
  seed: number;
}

/** A quick but human player: about one click per 0.7 s. */
const ACTION_MS = 700;
/** How long the idle comparison runs, in minutes. */
const IDLE_WINDOW = 10;

/**
 * The full balance report: an active player for the whole run, and the same game in which the player walks away
 * for the last minutes (same seed, so everything before is identical) and only the staff keep working.
 */
export function simulationReport({ minutes, seed }: ReportOptions): string {
  const base: SimOptions = { minutes, seed, actionMs: ACTION_MS, bot: { buys: true } };
  const active = runSimulation(base);
  const idleFrom = Math.max(0, minutes - IDLE_WINDOW);
  const idle = runSimulation({ ...base, idleFromMinute: idleFrom });
  return [
    ...formatRun(active, 'Active player'),
    '',
    `== Idle versus active (the player walks away at minute ${idleFrom}) ==`,
    formatIdleShare(active, idle, idleFrom, minutes),
  ].join('\n');
}
