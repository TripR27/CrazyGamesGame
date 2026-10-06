import type { Ticker } from '@/core/ticker';

const POLL_INTERVAL_MS = 50;

/** Drives a ticker from timers and tab visibility. Returns a stop function. */
export function startLoopDriver(ticker: Ticker): () => void {
  const timer = setInterval(() => ticker.advance(), POLL_INTERVAL_MS);
  const onVisibility = (): void => {
    if (!document.hidden) ticker.advance();
  };
  document.addEventListener('visibilitychange', onVisibility);

  return () => {
    clearInterval(timer);
    document.removeEventListener('visibilitychange', onVisibility);
  };
}
