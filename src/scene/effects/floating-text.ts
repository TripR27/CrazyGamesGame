import type { GameObjects, Scene } from 'phaser';
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
