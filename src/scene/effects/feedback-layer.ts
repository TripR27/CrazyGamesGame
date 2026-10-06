import type { Scene } from 'phaser';
import { formatNumber } from '@/core/format';
import { textKey } from '@/data/text-key';
import { t } from '@/i18n';
import { CAULDRON, CUSTOMER_SLOTS } from '@/scene/layout';
import type { SceneServices } from '@/scene/services';
import { bonusLines, GOLD_COLOR } from './bonus-lines';
import { createFloatingTexts } from './floating-text';

const BAD_COLOR = '#ffc2b8';
const LINE_ABOVE_SLOT = 125;
const GOLD_ABOVE_SLOT = 98;
const BONUS_ABOVE_SLOT = 72;
const BONUS_LINE_PX = 20;

/** Turns game events into floating "+gold" and funny lines near whoever they are about. */
export function createFeedbackLayer(scene: Scene, { bus }: SceneServices): () => void {
  const floats = createFloatingTexts(scene);
  const line = (key: string, recipeId?: string): string =>
    t(key, recipeId === undefined ? undefined : { drink: t(textKey('recipes', recipeId, 'name')) });

  const stops = [
    bus.on('customer:served', ({ seat, recipeId, gold, tip, extraReputation, messageKey }) => {
      const slot = CUSTOMER_SLOTS[seat];
      if (slot === undefined) return;
      floats.show(slot.x, slot.y - GOLD_ABOVE_SLOT, `+${formatNumber(gold)}`, { color: GOLD_COLOR, size: 24 });
      floats.show(slot.x, slot.y - LINE_ABOVE_SLOT, line(messageKey, recipeId));
      bonusLines(tip, extraReputation).forEach((b, i) => {
        floats.show(slot.x, slot.y - BONUS_ABOVE_SLOT + i * BONUS_LINE_PX, b.text, { color: b.color, size: 16 });
      });
    }),
    bus.on('customer:refused', ({ seat, recipeId, messageKey }) => {
      const slot = CUSTOMER_SLOTS[seat];
      if (slot !== undefined) floats.show(slot.x, slot.y - LINE_ABOVE_SLOT, line(messageKey, recipeId), { color: BAD_COLOR });
    }),
    bus.on('brew:notice', ({ messageKey }) => {
      floats.show(CAULDRON.x + CAULDRON.w / 2, CAULDRON.y - 60, line(messageKey), { color: BAD_COLOR });
    }),
  ];
  return () => stops.forEach((stop) => stop());
}
