/**
 * Pools of funny one-liners. A pool `served` with 4 lines means the i18n keys
 * `feedback.served.1` to `feedback.served.4` must exist (the content test checks this).
 */
export type FeedbackPoolId = 'served' | 'wrong' | 'nothing' | 'fizzle' | 'full' | 'busy';

export interface FeedbackPool {
  id: FeedbackPoolId;
  lines: number;
}

export const FEEDBACK_POOLS: readonly FeedbackPool[] = [
  { id: 'served', lines: 4 },
  { id: 'wrong', lines: 4 },
  { id: 'nothing', lines: 4 },
  { id: 'fizzle', lines: 3 },
  { id: 'full', lines: 2 },
  { id: 'busy', lines: 2 },
];
