import type { GameObjects } from 'phaser';
import type { Rect } from '@/scene/layout';

export type Graphics = GameObjects.Graphics;

export function fillRect(g: Graphics, rect: Rect, color: number): void {
  g.fillStyle(color, 1);
  g.fillRect(rect.x, rect.y, rect.w, rect.h);
}
