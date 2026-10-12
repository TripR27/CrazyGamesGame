import { t } from '@/i18n/translator';
import type { OfflineReport } from '@/offline/offline';
import { textKey } from '@/shared/content';
import { formatNumber } from '@/shared/numbers';

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

/** Why nothing was earned: no full crew yet, or a crew without Night Shift (with what it missed). */
function idleLines(report: OfflineReport): string[] {
  if (!report.hadStaff) return [t('welcome.nobody')];
  return [t('welcome.missed', { gold: formatNumber(report.missed) }), t('welcome.night_shift')];
}

/** "12 Bog Pearl, 5 Witch Moss": the loot the heroes brought home. */
const lootText = (loot: Record<string, number>): string =>
  Object.entries(loot).map(([id, n]) => t('heroes.stock_item', { name: t(textKey('ingredients', id, 'name')), n })).join(', ');

/** The welcome-back window as plain strings: what was earned (or why nothing was), and what the heroes on Auto did. */
export function toWelcomeView(report: OfflineReport): WelcomeView {
  const earned = report.served > 0;
  const lines = [
    t('welcome.away', { time: formatDuration(report.awayMs) }),
    ...(earned
      ? [
          t('welcome.served', { served: report.served }),
          t('welcome.gold', { gold: formatNumber(report.gold) }),
        ]
      : idleLines(report)),
    ...(report.capped && earned ? [t('welcome.capped', { limit: formatDuration(report.countedMs) })] : []),
    ...(report.trips > 0 ? [t('welcome.heroes', { trips: report.trips, loot: lootText(report.heroLoot) })] : []),
  ];
  return { title: t('welcome.title'), lines, button: t('welcome.collect') };
}
