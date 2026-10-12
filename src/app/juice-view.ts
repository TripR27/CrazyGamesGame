import type { GameObjects, Scene, Types } from 'phaser';
import { COIN_FRAMES, PUFF, SPARKLE_FRAMES } from '@/app/juice-art';
import { CAULDRON, HERO_SPOTS, SEAT_SLOTS } from '@/app/layout';
import { addAnimation, addStripTexture } from '@/app/textures-view';
import type { World } from '@/app/world';
import { recipes } from '@/recipes/recipe-data';
import { PIXEL } from '@/shared/pixels';

/** How much of each effect plays (counts of particles) and how strong the shake is for a legendary drink. */
const JUICE = {
  coins: 5, dailyCoins: 12, sparkles: 14, legendarySparkles: 40, levelSparkles: 24, steam: 3, fumes: 4,
  shake: { ms: 450, intensity: 0.006 }, flash: { ms: 300, r: 255, g: 236, b: 170 },
} as const;
const ANGRY_TINT = 0xff8a7a;
const CAULDRON_TOP = { x: CAULDRON.x + CAULDRON.w / 2, y: CAULDRON.y + 20 };
/** Above the HUD's gold counter (the DOM HUD covers the canvas top-left). */
const GOLD_SPOT = { x: 120, y: 90 };
const LEVEL_SPOT = { x: 640, y: 110 };

type Emitter = GameObjects.Particles.ParticleEmitter;

/** The emitters, made once; `explode` sends a burst, so nothing is created per effect. */
function createEmitters(scene: Scene): Record<'coins' | 'sparkles' | 'steam' | 'fumes', Emitter> {
  addStripTexture(scene, 'coin', COIN_FRAMES);
  addStripTexture(scene, 'sparkle', SPARKLE_FRAMES);
  addStripTexture(scene, 'puff', [PUFF]);
  addAnimation(scene, 'coin-spin', 'coin', [0, 1, 2, 3], 12);
  const make = (texture: string, config: Types.GameObjects.Particles.ParticleEmitterConfig): Emitter =>
    scene.add.particles(0, 0, texture, { emitting: false, ...config }).setDepth(45);
  return {
    coins: make('coin', { anim: 'coin-spin', speed: { min: 140, max: 280 }, angle: { min: 235, max: 305 }, gravityY: 760, lifespan: 950, scale: PIXEL * 0.75, alpha: { start: 1, end: 0, ease: 'Quad.easeIn' } }),
    sparkles: make('sparkle', { frame: [0, 1], speed: { min: 50, max: 190 }, angle: { min: 0, max: 360 }, lifespan: 750, scale: { start: PIXEL, end: 0 } }),
    steam: make('puff', { speed: { min: 15, max: 40 }, angle: { min: 255, max: 285 }, gravityY: -30, lifespan: 1100, scale: { start: PIXEL * 0.6, end: PIXEL * 1.2 }, alpha: { start: 0.7, end: 0 } }),
    fumes: make('puff', { tint: ANGRY_TINT, speed: { min: 30, max: 70 }, angle: { min: 230, max: 310 }, gravityY: -40, lifespan: 800, scale: { start: PIXEL * 0.5, end: PIXEL }, alpha: { start: 0.9, end: 0 } }),
  };
}

/**
 * The juice: coins jump out when a customer pays (and on the daily bonus), sparkles fly at a discovery (a legendary one
 * also shakes and flashes the screen), steam rises from a finished drink and red fumes come off a cross customer.
 */
export function startJuice(scene: Scene, { bus }: Pick<World, 'bus'>): () => void {
  const fx = createEmitters(scene);
  const atSeat = (seat: number, emitter: Emitter, count: number, above: number): void => {
    const slot = SEAT_SLOTS[seat];
    if (slot !== undefined) emitter.explode(count, slot.x, slot.y - above);
  };
  const stops = [
    bus.on('customer:served', ({ seat }) => atSeat(seat, fx.coins, JUICE.coins, 70)),
    bus.on('customer:refused', ({ seat }) => atSeat(seat, fx.fumes, JUICE.fumes, 90)),
    bus.on('daily:claimed', () => fx.coins.explode(JUICE.dailyCoins, GOLD_SPOT.x, GOLD_SPOT.y)),
    bus.on('brew:done', () => fx.steam.explode(JUICE.steam, CAULDRON_TOP.x, CAULDRON_TOP.y)),
    bus.on('reputation:levelUp', () => fx.sparkles.explode(JUICE.levelSparkles, LEVEL_SPOT.x, LEVEL_SPOT.y)),
    bus.on('hero:returned', ({ id }) => {
      const spot = HERO_SPOTS[id];
      if (spot !== undefined) fx.sparkles.explode(JUICE.sparkles, spot.x, spot.y - 50);
    }),
    bus.on('recipe:discovered', ({ recipeId }) => {
      const legendary = recipes.find((r) => r.id === recipeId)?.rarity === 'legendary';
      fx.sparkles.explode(legendary ? JUICE.legendarySparkles : JUICE.sparkles, CAULDRON_TOP.x, CAULDRON_TOP.y);
      if (!legendary) return;
      scene.cameras.main.shake(JUICE.shake.ms, JUICE.shake.intensity);
      scene.cameras.main.flash(JUICE.flash.ms, JUICE.flash.r, JUICE.flash.g, JUICE.flash.b);
    }),
  ];
  return () => stops.forEach((stop) => stop());
}
