import type { Effect } from '@/data/common';
import { t } from '@/i18n/index';

/** The icon of a drink effect (an emoji placeholder until the art pass). */
export const effectIcon = (effect: Effect): string => t(`effects.${effect}.icon`);

/** A text with the effect's icon in front, e.g. "⚡ Speed: drinks faster". */
export const withEffectIcon = (effect: Effect, text: string): string =>
  t('effects.with_icon', { icon: effectIcon(effect), text });

/** The effect as the book shows it: icon, name and what it does. */
export const effectName = (effect: Effect): string => withEffectIcon(effect, t(`effects.${effect}.name`));
