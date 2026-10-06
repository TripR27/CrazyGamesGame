import type { Scene } from 'phaser';
import type { CustomerSprite } from './customer-sprite';

/** Served: the order is done, the customer stays in the seat with a mug until the drink is finished. */
export function showDrinking(sprite: CustomerSprite): void {
  sprite.setOrderVisible(false);
  sprite.setDrinking(true);
}

/** A quick sideways shake when the customer turns the drink down. */
export function shakeNo(scene: Scene, sprite: CustomerSprite): void {
  if (scene.tweens.isTweening(sprite.container)) return;
  scene.tweens.add({ targets: sprite.container, x: sprite.container.x + 8, duration: 60, yoyo: true, repeat: 3 });
}
