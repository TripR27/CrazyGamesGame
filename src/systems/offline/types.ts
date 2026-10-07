import type { Num } from '@/shared/numbers';

/** What happened while the player was away. Shown in the welcome-back window. */
export interface OfflineReport {
  /** Real time away. */
  awayMs: number;
  /** The part of it that counts: at most the offline limit. */
  countedMs: number;
  /** Staff stopped working before the player came back. */
  capped: boolean;
  limitHours: number;
  /** Both a brewer and a waitress were hired, so something could be earned. */
  hadStaff: boolean;
  served: number;
  gold: Num;
  reputation: number;
}
