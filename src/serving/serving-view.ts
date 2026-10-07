import type { GameObjects, Scene } from 'phaser';
import { CAULDRON, SEAT_SLOTS } from '@/app/layout';
import type { World } from '@/app/world';
import { t } from '@/i18n/translator';
import { recipes } from '@/recipes/recipe-data';
import { withEffectIcon } from '@/serving/effects';
import { type Effect, textKey } from '@/shared/content';
import { formatNumber, type Num } from '@/shared/numbers';
import { createPool } from '@/shared/pool';

const RISE_PX = 50;
const DURATION_MS = 2200;
/** Text stays fully readable for this long before it fades. */
const HOLD_MS = 1300;
const MAX_WIDTH = 280;

export interface FloatOptions {
  color?: string;
  size?: number;
}

export interface FloatingTexts {
  /** Show `text` at x, y: it drifts up and fades out. `y` is the bottom of the text. */
  show(x: number, y: number, text: string, options?: FloatOptions): void;
}

/** Pooled text that rises and fades; used for "+gold" and funny lines. */
export function createFloatingTexts(scene: Scene): FloatingTexts {
  const pool = createPool<GameObjects.Text>({
    create: () =>
      scene.add
        .text(0, 0, '', { fontFamily: 'sans-serif', align: 'center', wordWrap: { width: MAX_WIDTH } })
        .setOrigin(0.5, 1)
        .setDepth(50),
    reset: (text) => text.setVisible(false),
  });

  return {
    show(x, y, text, { color = '#ffffff', size = 17 } = {}) {
      const label = pool.acquire();
      label
        .setText(text)
        .setStyle({ color, fontSize: `${size}px`, stroke: '#2a1a0c', strokeThickness: 4 })
        .setPosition(Math.min(1140, Math.max(140, x)), y)
        .setAlpha(1)
        .setVisible(true);
      scene.tweens.add({
        targets: label,
        y: y - RISE_PX,
        alpha: { from: 1, to: 0, delay: HOLD_MS, duration: DURATION_MS - HOLD_MS },
        duration: DURATION_MS,
        ease: 'Sine.easeOut',
        onComplete: () => pool.release(label),
      });
    },
  };
}

export const GOLD_COLOR = '#f5c542';
const CHARM_COLOR = '#ffb3e6';
const EFFECT_COLOR = '#c8f0ff';

/** What a served drink earned on top of its price. */
export interface ServedExtras {
  tip: Num;
  /** Charm plus a VIP's own bonus. */
  extraReputation: number;
  liked: boolean;
}

interface Line {
  text: string;
  color: string;
}

/** One line per effect, so the player sees what every drink did (a new effect is one more entry). */
const EFFECT_LINES: Readonly<Record<Effect, (extras: ServedExtras) => Line>> = {
  strength: () => ({ text: t('effects.strength.served'), color: GOLD_COLOR }),
  speed: () => ({ text: t('effects.speed.served'), color: EFFECT_COLOR }),
  luck: ({ tip }) =>
    tip.gt(0)
      ? { text: t('effects.luck.served', { n: formatNumber(tip) }), color: GOLD_COLOR }
      : { text: t('effects.luck.missed'), color: EFFECT_COLOR },
  charm: ({ extraReputation }) => ({ text: t('effects.charm.served', { n: extraReputation }), color: CHARM_COLOR }),
};

/**
 * The lines that float up after serving: the drink's effect with its icon (marked ♥x2 when the customer likes
 * it), and the extra reputation of a VIP when the drink itself is not a charm drink.
 */
export function bonusLines(effect: Effect, extras: ServedExtras): Line[] {
  const line = EFFECT_LINES[effect](extras);
  const text = withEffectIcon(effect, line.text);
  const lines = [{ ...line, text: extras.liked ? t('effects.liked_float', { line: text }) : text }];
  if (effect !== 'charm' && extras.extraReputation > 0) {
    lines.push({ text: t('effects.reputation', { n: extras.extraReputation }), color: CHARM_COLOR });
  }
  return lines;
}

const BAD_COLOR = '#ffc2b8';
const LINE_ABOVE_SLOT = 125;
const GOLD_ABOVE_SLOT = 98;
const BONUS_ABOVE_SLOT = 72;
const BONUS_LINE_PX = 20;

/** Turns game events into floating "+gold" and funny lines near whoever they are about. */
export function createFeedbackLayer(scene: Scene, { bus }: Pick<World, 'bus'>): () => void {
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
