import type { Scene, GameObjects } from 'phaser';
import { DOOR_ENTRY, SEAT_SLOTS } from '@/app/layout';
import { addAnimation, addPixelSprite, addStripTexture, bubbleTexture } from '@/app/textures-view';
import { createIconText, iconTexture } from '@/app/icon-text-view';
import { TAIL_ROWS } from '@/app/ui-art';
import type { World } from '@/app/world';
import { clickCustomer } from '@/serving/serving';
import { CUSTOMER_FRAME as F, CUSTOMER_LOOKS, customerFrames } from '@/customers/customer-art';
import { findCustomer, isWaiting } from '@/customers/customers';
import { t } from '@/i18n/translator';
import { recipes } from '@/recipes/recipe-data';
import { effectIcon } from '@/serving/effects';
import { type Effect, textKey } from '@/shared/content';
import { PIXEL } from '@/shared/pixels';
import { createPool, type Pool } from '@/shared/pool';
import { FONT } from '@/config';

/** What a customer is doing; each pose is one animation per customer type. */
type Pose = 'walk' | 'sit' | 'cross' | 'drink' | 'cheer' | 'sulk';

/** The animation of every pose: frames, frames per second, and -1 to loop or 0 to play once. */
const POSE_FRAMES: Readonly<Record<Pose, readonly [readonly number[], number, number]>> = {
  walk: [[F.walkA, F.stand, F.walkB, F.stand], 8, -1],
  // Seated and waiting, with a blink now and then.
  sit: [[F.sit, F.sit, F.sit, F.sit, F.sit, F.sit, F.sitBlink], 4, -1],
  // Waited too long: sits there angry.
  cross: [[F.angry], 1, -1],
  drink: [[F.drinkLow, F.drinkLow, F.drinkHigh, F.drinkHigh, F.drinkHigh, F.drinkLow], 3, -1],
  cheer: [[F.happy, F.sit, F.happy, F.happy], 6, 0],
  sulk: [[F.angry, F.angry, F.angry, F.angry], 4, 0],
};

const textureFor = (typeId: string): string => `customer_${CUSTOMER_LOOKS.includes(typeId) ? typeId : 'knight'}`;
const animKey = (texture: string, pose: Pose): string => `${texture}-${pose}`;

/** The textures and animations of every customer type (once per game). */
function addCustomerArt(scene: Scene): void {
  for (const id of CUSTOMER_LOOKS) {
    const texture = textureFor(id);
    addStripTexture(scene, texture, customerFrames(id));
    for (const [pose, [frames, rate, repeat]] of Object.entries(POSE_FRAMES)) {
      addAnimation(scene, animKey(texture, pose as Pose), texture, frames, rate, repeat);
    }
  }
}

/**
 * The text in a customer's order bubble: the drink with the icon of its effect, a ♥ when they like that effect
 * (it counts double) and a crown for a VIP.
 */
export function orderLabel(customer: { recipeId: string; liked: boolean; vip: boolean }, effect: Effect): string {
  const params = { drink: t(textKey('recipes', customer.recipeId, 'name')), icon: effectIcon(effect) };
  const order = t(customer.liked ? 'effects.liked_order' : 'effects.order', params);
  return customer.vip ? t('customers.vip_order', { order }) : order;
}

/** Served: the order is done; the customer cheers, hops, and then drinks in the seat until the drink is finished. */
export function showDrinking(scene: Scene, sprite: CustomerSprite): void {
  sprite.setOrderVisible(false);
  sprite.play('cheer', 'drink');
  scene.tweens.add({ targets: sprite.figure, y: -12, duration: 140, yoyo: true, repeat: 1, ease: 'Sine.easeOut' });
}

/** A quick sideways shake and an angry face when the customer turns the drink down. */
export function shakeNo(scene: Scene, sprite: CustomerSprite): void {
  sprite.play('sulk', 'sit');
  if (scene.tweens.isTweening(sprite.container)) return;
  scene.tweens.add({ targets: sprite.container, x: sprite.container.x + 8, duration: 60, yoyo: true, repeat: 3 });
}

const BAR_WIDTH = 44;
const BAR_Y = -96;
const BUBBLE_HEIGHT = 28;
const BUBBLE_Y = { low: -122, raised: -152 } as const;
const BAR_COLORS = { good: 0x7be05a, warn: 0xf5c542, bad: 0xe2563b } as const;
/** Room around the order text inside the bubble, and its smallest width (design pixels). */
const BUBBLE_PAD = 8;
const BUBBLE_MIN_TEXT = 50;
/** The green arrow over a customer who wants the drink the player holds. */
const MARK_SCALE = 3;
/** Below this much patience left, a waiting customer sits there cross. */
const CROSS_BELOW = 0.25;
const STORMED_OUT_TINT = 0xffb0a0;

/** A pooled customer: the pixel-art figure, a drink bubble and a patience bar. */
export interface CustomerSprite {
  container: GameObjects.Container;
  figure: GameObjects.Sprite;
  /** The customer this sprite shows right now; null while it is idle or walking out (then clicks do nothing). */
  customerId: number | null;
  /** Dress the sprite for a new customer. `raised` lifts the bubble so neighbours do not overlap. */
  setLook(typeId: string, orderText: string, raised: boolean): void;
  /** `fraction` is patience left, 0 to 1. */
  setPatience(fraction: number): void;
  /** Hide the bubble and bar, e.g. while the customer walks out. */
  setOrderVisible(visible: boolean): void;
  /** Plays a pose (looping or once); `next` follows a pose that plays once. Does nothing if that pose already plays. */
  play(pose: Pose, next?: Pose): void;
  /** The pose that plays now (or that a played-once pose goes back to). */
  pose: Pose | null;
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

/**
 * The pixel-art speech bubble with the order text (its tail points at the customer), and the green arrow that marks a
 * customer for the picked-up drink; a marked bubble gets a green edge. The bubble texture is made once per size.
 */
function createBubble(scene: Scene) {
  const bubble = scene.add.image(0, BUBBLE_Y.low, '__DEFAULT').setOrigin(0.5, 0).setScale(PIXEL);
  const text = createIconText(scene, { fontFamily: FONT, fontSize: '14px', color: '#3b2410' });
  const mark = scene.add.image(0, BUBBLE_Y.low - BUBBLE_HEIGHT / 2, iconTexture(scene, '▼')).setOrigin(0.5, 1).setScale(MARK_SCALE).setVisible(false);
  const keys = { normal: '__DEFAULT', marked: '__DEFAULT' };
  let marked = false;
  const fit = (y: number): void => {
    bubble.setTexture(marked ? keys.marked : keys.normal);
    const bodyHeight = (bubble.height - TAIL_ROWS) * PIXEL;
    bubble.setY(y - bodyHeight / 2);
    mark.setY(y - bodyHeight / 2 - 2);
  };
  return {
    parts: [bubble, text.container],
    mark,
    show(orderText: string, y: number): void {
      text.setText(orderText);
      text.container.setY(y);
      const width = Math.max(BUBBLE_MIN_TEXT, text.width);
      keys.normal = bubbleTexture(scene, width, text.height, 'parchment', true, BUBBLE_PAD);
      keys.marked = bubbleTexture(scene, width, text.height, 'marked', true, BUBBLE_PAD);
      fit(y);
    },
    setMarked(now: boolean): void {
      if (marked === now) return;
      marked = now;
      mark.setVisible(now);
      fit(text.container.y);
    },
  };
}

export function createCustomerSprite(scene: Scene, onClick: (customerId: number) => void): CustomerSprite {
  const hit = scene.add.rectangle(0, -48, 64, 100, 0xffffff, 0.001);
  const figure = addPixelSprite(scene, 0, 0, textureFor('knight'));
  const bubble = createBubble(scene);
  const { barBack, bar } = createPatienceBar(scene);
  const order = [...bubble.parts, barBack, bar];
  const container = scene.add.container(0, 0, [hit, figure, ...order, bubble.mark]);
  container.setVisible(false);
  let texture = textureFor('knight');
  const sprite: CustomerSprite = {
    container,
    figure,
    customerId: null,
    pose: null,
    setLook(typeId, orderText, raised) {
      texture = textureFor(typeId);
      figure.setTexture(texture, 0).clearTint().setY(0);
      sprite.pose = null;
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
    play(pose, next) {
      if (pose === sprite.pose && next === undefined) return;
      sprite.pose = next ?? pose;
      figure.play(animKey(texture, pose));
      if (next !== undefined) figure.chain(animKey(texture, next));
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

function walkTo(ctx: LayerContext, sprite: CustomerSprite, x: number, y: number, onDone: () => void): void {
  ctx.scene.tweens.killTweensOf(sprite.container);
  sprite.play('walk');
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
  walkTo(ctx, sprite, slot.x, slot.y, () => sprite.play('sit'));
  ctx.active.set(id, sprite);
  const box = sprite.container;
  ctx.unregister.set(id, ctx.services.targets.register(`customer:${id}`, () => ({ x: box.x - 34, y: box.y - 104, w: 68, h: 108 })));
}

/** A served customer walks out content; one who waited too long storms out red-faced. */
function onLeft(ctx: LayerContext, id: number, stormedOut: boolean): void {
  const sprite = ctx.active.get(id);
  if (sprite === undefined) return;
  ctx.active.delete(id);
  ctx.unregister.get(id)?.();
  ctx.unregister.delete(id);
  sprite.customerId = null;
  sprite.setOrderVisible(false);
  if (stormedOut) sprite.figure.setTint(STORMED_OUT_TINT);
  walkTo(ctx, sprite, DOOR_ENTRY.x, DOOR_ENTRY.y, () => ctx.pool.release(sprite));
}

function refresh(ctx: LayerContext): void {
  const picked = ctx.services.selection.selected();
  for (const [id, sprite] of ctx.active) {
    const customer = findCustomer(ctx.services.floor, id);
    if (customer === undefined) continue;
    const patience = customer.patienceMs / customer.patienceMaxMs;
    const waiting = isWaiting(customer);
    sprite.setPatience(patience);
    sprite.setMarked(picked !== null && waiting && customer.recipeId === picked);
    // A seated customer whose patience runs low turns cross.
    if (waiting && sprite.pose === 'sit' && patience < CROSS_BELOW) sprite.play('cross');
  }
}

/** Shows the customers from the simulation: pooled sprites that walk in, wait and walk out. */
export function createCustomersLayer(scene: Scene, services: World): CustomersLayer {
  addCustomerArt(scene);
  const ctx: LayerContext = {
    scene,
    services,
    active: new Map(),
    unregister: new Map(),
    pool: createPool<CustomerSprite>({
      create: () => createCustomerSprite(scene, (id) => clickCustomer(services, id)),
      reset: (sprite) => {
        sprite.container.setVisible(false);
        sprite.figure.stop();
      },
    }),
  };
  const withSprite = (id: number, react: (sprite: CustomerSprite) => void): void => {
    const sprite = ctx.active.get(id);
    if (sprite !== undefined) react(sprite);
  };
  const stops = [
    services.bus.on('customer:arrived', ({ id }) => onArrived(ctx, id)),
    services.bus.on('customer:left', ({ id, reason }) => onLeft(ctx, id, reason === 'impatient')),
    services.bus.on('customer:refused', ({ id }) => withSprite(id, (sprite) => shakeNo(scene, sprite))),
    services.bus.on('customer:served', ({ id }) => withSprite(id, (sprite) => showDrinking(scene, sprite))),
  ];
  return {
    update: () => refresh(ctx),
    destroy: () => stops.forEach((stop) => stop()),
  };
}
