import { FEEDBACK_POOLS, type FeedbackPoolId } from '@/data/feedback';
import { textKey } from '@/data/text-key';
import { pickRandom, type Rng } from '@/shared/random';

/** Pick a random line from a pool, as an i18n key. Systems choose (so tests can seed it); the UI translates. */
export function feedbackKey(pool: FeedbackPoolId, rng: Rng): string {
  const lines = FEEDBACK_POOLS.find((p) => p.id === pool)?.lines ?? 1;
  const numbers = Array.from({ length: lines }, (_, i) => String(i + 1));
  return textKey('feedback', pool, pickRandom(rng, numbers) ?? '1');
}
