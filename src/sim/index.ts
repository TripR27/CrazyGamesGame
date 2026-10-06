import { formatIdleShare, formatRun } from './report';
import { runSimulation, type SimOptions } from './run';

export { runSimulation, type SimOptions, type SimResult, type Snapshot } from './run';
export { formatIdleShare, formatRun } from './report';

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
