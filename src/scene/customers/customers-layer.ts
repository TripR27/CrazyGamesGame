import type { Scene } from 'phaser';
import { createPool, type Pool } from '@/core/pool';
import { recipes } from '@/data/recipes';
import { DOOR_ENTRY } from '@/scene/layout';
import { SEAT_SLOTS } from '@/scene/layout-rooms';
import type { SceneServices } from '@/scene/services';
import { findCustomer, isWaiting } from '@/systems/customers';
import { shakeNo, showDrinking } from './customer-reactions';
import { createCustomerSprite, type CustomerSprite } from './customer-sprite';
import { orderLabel } from './order-label';

const WALK_MS = 900;

export interface CustomersLayer {
  /** Call every frame: keeps the patience bars and the marks for a picked drink in line with the game. */
  update(): void;
  destroy(): void;
}

interface LayerContext {
  scene: Scene;
  services: SceneServices;
  pool: Pool<CustomerSprite>;
  active: Map<number, CustomerSprite>;
  /** Removes the tutorial target of each customer who is seated. */
  unregister: Map<number, () => void>;
}

function walkTo(ctx: LayerContext, sprite: CustomerSprite, x: number, y: number, onDone?: () => void): void {
  ctx.scene.tweens.killTweensOf(sprite.container);
  ctx.scene.tweens.add({ targets: sprite.container, x, y, duration: WALK_MS, ease: 'Sine.easeInOut', onComplete: onDone });
}

function onArrived(ctx: LayerContext, id: number): void {
  const customer = findCustomer(ctx.services.floor, id);
  const slot = customer === undefined ? undefined : SEAT_SLOTS[customer.seat];
  const recipe = recipes.find((r) => r.id === customer?.recipeId);
  if (customer === undefined || slot === undefined || recipe === undefined) return;
  const sprite = ctx.pool.acquire();
  sprite.setLook(customer.typeId, orderLabel(customer, recipe.effect), customer.seat % 2 === 1);
  sprite.setPatience(1);
  sprite.setOrderVisible(true);
  sprite.customerId = id;
  sprite.container.setPosition(DOOR_ENTRY.x, DOOR_ENTRY.y).setVisible(true);
  walkTo(ctx, sprite, slot.x, slot.y);
  ctx.active.set(id, sprite);
  const box = sprite.container;
  ctx.unregister.set(id, ctx.services.targets.register(`customer:${id}`, () => ({ x: box.x - 38, y: box.y - 112, w: 76, h: 118 })));
}

function onLeft(ctx: LayerContext, id: number): void {
  const sprite = ctx.active.get(id);
  if (sprite === undefined) return;
  ctx.active.delete(id);
  ctx.unregister.get(id)?.();
  ctx.unregister.delete(id);
  sprite.customerId = null;
  sprite.setOrderVisible(false);
  sprite.setDrinking(false);
  walkTo(ctx, sprite, DOOR_ENTRY.x, DOOR_ENTRY.y, () => ctx.pool.release(sprite));
}

function refresh(ctx: LayerContext): void {
  const picked = ctx.services.selection.selected();
  for (const [id, sprite] of ctx.active) {
    const customer = findCustomer(ctx.services.floor, id);
    if (customer === undefined) continue;
    sprite.setPatience(customer.patienceMs / customer.patienceMaxMs);
    sprite.setMarked(picked !== null && isWaiting(customer) && customer.recipeId === picked);
  }
}

/** Shows the customers from the simulation: pooled sprites that walk in, wait and walk out. */
export function createCustomersLayer(scene: Scene, services: SceneServices): CustomersLayer {
  const ctx: LayerContext = {
    scene,
    services,
    active: new Map(),
    unregister: new Map(),
    pool: createPool<CustomerSprite>({
      create: () => createCustomerSprite(scene, services.actions.clickCustomer),
      reset: (sprite) => sprite.container.setVisible(false),
    }),
  };
  const withSprite = (id: number, react: (sprite: CustomerSprite) => void): void => {
    const sprite = ctx.active.get(id);
    if (sprite !== undefined) react(sprite);
  };
  const stops = [
    services.bus.on('customer:arrived', ({ id }) => onArrived(ctx, id)),
    services.bus.on('customer:left', ({ id }) => onLeft(ctx, id)),
    services.bus.on('customer:refused', ({ id }) => withSprite(id, (sprite) => shakeNo(scene, sprite))),
    services.bus.on('customer:served', ({ id }) => withSprite(id, showDrinking)),
  ];
  return {
    update: () => refresh(ctx),
    destroy: () => stops.forEach((stop) => stop()),
  };
}
