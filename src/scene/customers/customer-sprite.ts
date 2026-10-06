import type { GameObjects, Scene } from 'phaser';
import { bodyColorFor, SKIN_COLOR } from './customer-look';

const BAR_WIDTH = 44;
const BAR_Y = -70;
const BUBBLE_HEIGHT = 28;
const BUBBLE_Y = { low: -96, raised: -126 } as const;
const BAR_COLORS = { good: 0x7be05a, warn: 0xf5c542, bad: 0xe2563b } as const;

/** A pooled placeholder customer: body, head, a drink bubble and a patience bar. */
export interface CustomerSprite {
  container: GameObjects.Container;
  /** The customer this sprite shows right now; null while it is idle or walking out (then clicks do nothing). */
  customerId: number | null;
  /** Dress the sprite for a new customer. `raised` lifts the bubble so neighbours do not overlap. */
  setLook(typeId: string, orderText: string, raised: boolean): void;
  /** `fraction` is patience left, 0 to 1. */
  setPatience(fraction: number): void;
  /** Hide the bubble and bar, e.g. while the customer walks out. */
  setOrderVisible(visible: boolean): void;
}

function barColor(fraction: number): number {
  if (fraction > 0.5) return BAR_COLORS.good;
  return fraction > 0.25 ? BAR_COLORS.warn : BAR_COLORS.bad;
}

export function createCustomerSprite(scene: Scene, onClick: (customerId: number) => void): CustomerSprite {
  const hit = scene.add.rectangle(0, -55, 80, 130, 0xffffff, 0.001);
  const body = scene.add.rectangle(0, -20, 30, 38, 0xffffff);
  const head = scene.add.circle(0, -48, 13, SKIN_COLOR);
  const bubble = scene.add.rectangle(0, BUBBLE_Y.low, 100, BUBBLE_HEIGHT, 0xfff7e0).setStrokeStyle(2, 0x5e3a18);
  const text = scene.add
    .text(0, BUBBLE_Y.low, '', { fontFamily: 'sans-serif', fontSize: '14px', color: '#3b2410' })
    .setOrigin(0.5);
  const barBack = scene.add.rectangle(0, BAR_Y, BAR_WIDTH, 6, 0x2a1a0c);
  const bar = scene.add.rectangle(-BAR_WIDTH / 2, BAR_Y, BAR_WIDTH, 6, BAR_COLORS.good).setOrigin(0, 0.5);
  const order = [bubble, text, barBack, bar];
  const container = scene.add.container(0, 0, [hit, body, head, ...order]);
  container.setVisible(false);
  const sprite: CustomerSprite = {
    container,
    customerId: null,
    setLook(typeId, orderText, raised) {
      const y = raised ? BUBBLE_Y.raised : BUBBLE_Y.low;
      body.setFillStyle(bodyColorFor(typeId));
      text.setText(orderText).setY(y);
      bubble.setSize(Math.max(70, text.width + 20), BUBBLE_HEIGHT).setY(y);
    },
    setPatience(fraction) {
      const clamped = Math.min(1, Math.max(0, fraction));
      bar.setSize(BAR_WIDTH * clamped, 6).setFillStyle(barColor(clamped));
    },
    setOrderVisible(visible) {
      for (const part of order) part.setVisible(visible);
    },
  };
  hit.setInteractive({ useHandCursor: true });
  hit.on('pointerdown', () => {
    if (sprite.customerId !== null) onClick(sprite.customerId);
  });
  return sprite;
}
