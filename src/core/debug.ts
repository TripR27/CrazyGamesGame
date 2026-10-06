/** Logs in development only; removed from production builds. */
export function debug(...args: unknown[]): void {
  if (import.meta.env.DEV) {
    // eslint-disable-next-line no-console
    console.debug('[bt]', ...args);
  }
}
