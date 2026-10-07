import type { OfflineReport } from '@/systems/offline/types';

/**
 * Where reports wait for the welcome-back window. A report can arrive before the window exists
 * (the game loads, then the UI mounts), so listeners also get what is already waiting.
 */
export interface OfflineInbox {
  post(report: OfflineReport): void;
  /** The waiting report, once; null when there is none. */
  take(): OfflineReport | null;
  /** Called for each new report. Returns an unsubscribe function. */
  subscribe(listener: (report: OfflineReport) => void): () => void;
}

export function createOfflineInbox(): OfflineInbox {
  let waiting: OfflineReport | null = null;
  const listeners = new Set<(report: OfflineReport) => void>();
  return {
    post(report) {
      waiting = report;
      for (const listener of [...listeners]) listener(report);
    },
    take() {
      const report = waiting;
      waiting = null;
      return report;
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}
