import type { Scene, GameObjects } from 'phaser';
import { DOOR_ENTRY, SEAT_SLOTS } from '@/app/layout';
import type { World } from '@/app/world';
import { clickCustomer } from '@/serving/serving';
import { findCustomer, isWaiting } from '@/customers/customers';
import { t } from '@/i18n/translator';
import { recipes } from '@/recipes/recipe-data';
import { effectIcon } from '@/serving/effects';
import { type Effect, textKey } from '@/shared/content';
import { createPool, type Pool } from '@/shared/pool';

/** Placeholder looks per customer type: just a body colour. The art pass replaces this with sprites. */
const BODY_COLORS: Readonly<Record<string, number>> = {
  knight: 0x8d99a8,
  elf: 0x58b368,
  dwarf: 0xa5683a,
  king: 0xd4a017,
};

const FALLBACK_COLOR = 0xb36bd1;
export const SKIN_COLOR = 0xf2c9a0;

export const bodyColorFor = (typeId: string): number => BODY_COLORS[typeId] ?? FALLBACK_COLOR;

/**
 * The text in a customer's order bubble: the drink with the icon of its effect, a ♥ when they like that effect
 * (it counts double) and a crown for a VIP.
 */
export function orderLabel(customer: { recipeId: string; liked: boolean; vip: boolean }, effect: Effect): string {
  const params = { drink: t(textKey('recipes', customer.recipeId, 'name')), icon: effectIcon(effect) };
  const order = t(customer.liked ? 'effects.liked_order' : 'effects.order', params);
  return customer.vip ? t('customers.vip_order', { order }) : order;
}

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

const BAR_WIDTH = 44;
const BAR_Y = -70;
const BUBBLE_HEIGHT = 28;
const BUBBLE_Y = { low: -96, raised: -126 } as const;
const BAR_COLORS = { good: 0x7be05a, warn: 0xf5c542, bad: 0xe2563b } as const;
const MUG_COLOR = 0xe0a030;
const EDGE = { normal: 0x5e3a18, marked: 0x3fbf3f } as const;

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
  /** Show a mug in the customer's hand while they drink. */
  setDrinking(drinking: boolean): void;
  /** A green bubble and a small arrow: this customer ordered the drink the player picked up. */
  setMarked(marked: boolean): void;
}

function barColor(fraction: number): number {
  if (fraction > 0.5) return BAR_COLORS.good;
  return fraction > 0.25 ? BAR_COLORS.warn : BAR_COLORS.bad;
}

function createPatienceBar(scene: Scene) {
  const barBack = scene.add.rectangle(0, BAR_Y, BAR_WIDTH, 6, 0x2a1a0c);
  const bar = scene.add.rectangle(-BAR_WIDTH / 2, BAR_Y, BAR_WIDTH, 6, BAR_COLORS.good).setOrigin(0, 0.5);
  return { barBack, bar };
}

/** The bubble with the order text, and the green arrow that marks a customer for the picked-up drink. */
function createBubble(scene: Scene) {
  const bubble = scene.add.rectangle(0, BUBBLE_Y.low, 100, BUBBLE_HEIGHT, 0xfff7e0).setStrokeStyle(2, EDGE.normal);
  const text = scene.add
    .text(0, BUBBLE_Y.low, '', { fontFamily: 'sans-serif', fontSize: '14px', color: '#3b2410' })
    .setOrigin(0.5);
  const mark = scene.add
    .text(0, BUBBLE_Y.low - BUBBLE_HEIGHT / 2, '▼', { fontFamily: 'sans-serif', fontSize: '18px', color: '#3fbf3f' })
    .setOrigin(0.5, 1)
    .setVisible(false);
  return {
    parts: [bubble, text],
    mark,
    show(orderText: string, y: number): void {
      text.setText(orderText).setY(y);
      mark.setY(y - BUBBLE_HEIGHT / 2);
      bubble.setSize(Math.max(70, text.width + 20), BUBBLE_HEIGHT).setY(y);
    },
    setMarked(marked: boolean): void {
      if (mark.visible === marked) return;
      mark.setVisible(marked);
      bubble.setStrokeStyle(marked ? 4 : 2, marked ? EDGE.marked : EDGE.normal);
    },
  };
}

export function createCustomerSprite(scene: Scene, onClick: (customerId: number) => void): CustomerSprite {
  const hit = scene.add.rectangle(0, -55, 80, 130, 0xffffff, 0.001);
  const body = scene.add.rectangle(0, -20, 30, 38, 0xffffff);
  const head = scene.add.circle(0, -48, 13, SKIN_COLOR);
  const bubble = createBubble(scene);
  const { barBack, bar } = createPatienceBar(scene);
  const order = [...bubble.parts, barBack, bar];
  const mug = scene.add.rectangle(20, -26, 10, 14, MUG_COLOR).setStrokeStyle(2, 0x5e3a18).setVisible(false);
  const container = scene.add.container(0, 0, [hit, body, head, mug, ...order, bubble.mark]);
  container.setVisible(false);
  const sprite: CustomerSprite = {
    container,
    customerId: null,
    setLook(typeId, orderText, raised) {
      body.setFillStyle(bodyColorFor(typeId));
      bubble.show(orderText, raised ? BUBBLE_Y.raised : BUBBLE_Y.low);
    },
    setPatience(fraction) {
      const clamped = Math.min(1, Math.max(0, fraction));
      bar.setSize(BAR_WIDTH * clamped, 6).setFillStyle(barColor(clamped));
    },
    setOrderVisible(visible) {
      for (const part of order) part.setVisible(visible);
      if (!visible) bubble.setMarked(false);
    },
    setDrinking(drinking) {
      mug.setVisible(drinking);
    },
    setMarked: bubble.setMarked,
  };
  hit.setInteractive({ useHandCursor: true }).on('pointerdown', () => {
    if (sprite.customerId !== null) onClick(sprite.customerId);
  });
  return sprite;
}

const WALK_MS = 900;

export interface CustomersLayer {
  /** Call every frame: keeps the patience bars and the marks for a picked drink in line with the game. */
  update(): void;
  destroy(): void;
}

interface LayerContext {
  scene: Scene;
  services: World;
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
export function createCustomersLayer(scene: Scene, services: World): CustomersLayer {
  const ctx: LayerContext = {
    scene,
    services,
    active: new Map(),
    unregister: new Map(),
    pool: createPool<CustomerSprite>({
      create: () => createCustomerSprite(scene, (id) => clickCustomer(services, id)),
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
