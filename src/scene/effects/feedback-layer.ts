import type { Scene } from 'phaser';
import { t } from '@/i18n/index';
import { recipes } from '@/recipes/recipe-data';
import { bonusLines, GOLD_COLOR } from '@/scene/effects/bonus-lines';
import { createFloatingTexts } from '@/scene/effects/floating-text';
import { CAULDRON } from '@/scene/layout';
import { SEAT_SLOTS } from '@/scene/layout-rooms';
import type { SceneServices } from '@/scene/services';
import { textKey } from '@/shared/content';
import { formatNumber } from '@/shared/numbers';

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
    bus.on('customer:served', ({ seat, recipeId, gold, tip, extraReputation, liked, messageKey }) => {
      const slot = SEAT_SLOTS[seat];
      const effect = recipes.find((r) => r.id === recipeId)?.effect;
      if (slot === undefined || effect === undefined) return;
      floats.show(slot.x, slot.y - GOLD_ABOVE_SLOT, `+${formatNumber(gold)}`, { color: GOLD_COLOR, size: 24 });
      floats.show(slot.x, slot.y - LINE_ABOVE_SLOT, line(messageKey, recipeId));
      bonusLines(effect, { tip, extraReputation, liked }).forEach((b, i) => {
        floats.show(slot.x, slot.y - BONUS_ABOVE_SLOT + i * BONUS_LINE_PX, b.text, { color: b.color, size: 16 });
      });
    }),
    bus.on('customer:refused', ({ seat, recipeId, messageKey }) => {
      const slot = SEAT_SLOTS[seat];
      if (slot !== undefined) floats.show(slot.x, slot.y - LINE_ABOVE_SLOT, line(messageKey, recipeId), { color: BAD_COLOR });
    }),
    bus.on('recipe:discovered', ({ recipeId }) => {
      floats.show(CAULDRON.x + CAULDRON.w / 2, CAULDRON.y - 60, line('book.eureka', recipeId), { color: GOLD_COLOR, size: 26 });
    }),
    bus.on('brew:notice', ({ messageKey }) => {
      floats.show(CAULDRON.x + CAULDRON.w / 2, CAULDRON.y - 60, line(messageKey), { color: BAD_COLOR });
    }),
  ];
  return () => stops.forEach((stop) => stop());
}
