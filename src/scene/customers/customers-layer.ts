import type { Scene } from 'phaser';
import { createPool, type Pool } from '@/core/pool';
import { textKey } from '@/data/text-key';
import { t } from '@/i18n';
import { CUSTOMER_SLOTS, DOOR_ENTRY } from '@/scene/layout';
import type { SceneServices } from '@/scene/services';
import { findCustomer } from '@/systems/customers';
import { createCustomerSprite, type CustomerSprite } from './customer-sprite';

const WALK_MS = 900;

export interface CustomersLayer {
  /** Call every frame: keeps the patience bars in line with the simulation. */
  update(): void;
  destroy(): void;
}

interface LayerContext {
  scene: Scene;
  services: SceneServices;
  pool: Pool<CustomerSprite>;
  active: Map<number, CustomerSprite>;
}

function walkTo(ctx: LayerContext, sprite: CustomerSprite, x: number, y: number, onDone?: () => void): void {
  ctx.scene.tweens.killTweensOf(sprite.container);
  ctx.scene.tweens.add({ targets: sprite.container, x, y, duration: WALK_MS, ease: 'Sine.easeInOut', onComplete: onDone });
}

function onArrived(ctx: LayerContext, id: number): void {
  const customer = findCustomer(ctx.services.floor, id);
  const slot = customer === undefined ? undefined : CUSTOMER_SLOTS[customer.seat];
  if (customer === undefined || slot === undefined) return;
  const sprite = ctx.pool.acquire();
  const order = t(textKey('recipes', customer.recipeId, 'name'));
  sprite.setLook(customer.typeId, order, customer.seat % 2 === 1);
  sprite.setPatience(1);
  sprite.setOrderVisible(true);
  sprite.customerId = id;
  sprite.container.setPosition(DOOR_ENTRY.x, DOOR_ENTRY.y).setVisible(true);
  walkTo(ctx, sprite, slot.x, slot.y);
  ctx.active.set(id, sprite);
}

function onLeft(ctx: LayerContext, id: number): void {
  const sprite = ctx.active.get(id);
  if (sprite === undefined) return;
  ctx.active.delete(id);
  sprite.customerId = null;
  sprite.setOrderVisible(false);
  walkTo(ctx, sprite, DOOR_ENTRY.x, DOOR_ENTRY.y, () => ctx.pool.release(sprite));
}

/** A quick sideways shake when the customer turns the drink down. */
function onRefused(ctx: LayerContext, id: number): void {
  const sprite = ctx.active.get(id);
  if (sprite === undefined || ctx.scene.tweens.isTweening(sprite.container)) return;
  ctx.scene.tweens.add({ targets: sprite.container, x: sprite.container.x + 8, duration: 60, yoyo: true, repeat: 3 });
}

function refreshPatience(ctx: LayerContext): void {
  for (const [id, sprite] of ctx.active) {
    const customer = findCustomer(ctx.services.floor, id);
    if (customer !== undefined) sprite.setPatience(customer.patienceMs / customer.patienceMaxMs);
  }
}

/** Shows the customers from the simulation: pooled sprites that walk in, wait and walk out. */
export function createCustomersLayer(scene: Scene, services: SceneServices): CustomersLayer {
  const ctx: LayerContext = {
    scene,
    services,
    active: new Map(),
    pool: createPool<CustomerSprite>({
      create: () => createCustomerSprite(scene, services.actions.clickCustomer),
      reset: (sprite) => sprite.container.setVisible(false),
    }),
  };
  const stops = [
    services.bus.on('customer:arrived', ({ id }) => onArrived(ctx, id)),
    services.bus.on('customer:left', ({ id }) => onLeft(ctx, id)),
    services.bus.on('customer:refused', ({ id }) => onRefused(ctx, id)),
  ];
  return {
    update: () => refreshPatience(ctx),
    destroy: () => stops.forEach((stop) => stop()),
  };
}
