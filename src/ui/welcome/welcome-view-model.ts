import { t } from '@/i18n/index';
import { formatNumber } from '@/shared/numbers';
import type { OfflineReport } from '@/systems/offline/types';

const HOUR_MS = 3_600_000;
const MINUTE_MS = 60_000;

/** "1h 23m", "45m" or "50s": the two biggest units that are not zero. */
export function formatDuration(ms: number): string {
  const hours = Math.floor(ms / HOUR_MS);
  const minutes = Math.floor((ms % HOUR_MS) / MINUTE_MS);
  const seconds = Math.floor((ms % MINUTE_MS) / 1000);
  const parts = [
    hours > 0 ? t('time.hours', { n: hours }) : '',
    minutes > 0 ? t('time.minutes', { n: minutes }) : '',
    hours === 0 && minutes === 0 ? t('time.seconds', { n: seconds }) : '',
  ];
  return parts.filter((p) => p !== '').join(' ');
}

export interface WelcomeView {
  title: string;
  lines: string[];
  button: string;
}

/** The welcome-back window as plain strings: what was earned, or why nothing was. */
export function toWelcomeView(report: OfflineReport): WelcomeView {
  const earned = report.served > 0;
  const lines = [
    t('welcome.away', { time: formatDuration(report.awayMs) }),
    ...(earned
      ? [
          t('welcome.served', { served: report.served }),
          t('welcome.gold', { gold: formatNumber(report.gold) }),
        ]
      : [t('welcome.nobody')]),
    ...(report.capped && report.hadStaff ? [t('welcome.capped', { limit: formatDuration(report.countedMs) })] : []),
  ];
  return { title: t('welcome.title'), lines, button: t('welcome.collect') };
}
