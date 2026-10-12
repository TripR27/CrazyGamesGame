import type { GameObjects, Scene } from 'phaser';
import { HERO_CAULDRON, HERO_SPOTS, ROOM_SPOTS, type Point } from '@/app/layout';
import type { World } from '@/app/world';
import { brewProgress } from '@/brewing/brewing';
import { BOSSES } from '@/heroes/boss-fight';
import { ingredientColor } from '@/brewing/brewing-view';
import { aimHeroCauldron, clickHero } from '@/heroes/hero-brewing';
import { guildBuilt, HERO_CLASSES, heroStatus, heroWaitMs, type HeroStatus } from '@/heroes/heroes';
import { clockText } from '@/heroes/heroes-model';
import { t } from '@/i18n/translator';
import { createFloatingTexts, GOLD_COLOR } from '@/serving/serving-view';
import { GUILD_ROOM_ID } from '@/rooms/rooms';
import { textKey } from '@/shared/content';
import type { GameEvents } from '@/shared/events';

/** Placeholder looks per hero class (the art pass replaces them): a body colour and what they carry. */
const LOOKS: Readonly<Record<string, { body: number; gear: number }>> = {
  warrior: { body: 0xb03a2e, gear: 0xb8c2cc },
  mage: { body: 0x3b5bb5, gear: 0x7a3fb0 },
};
const SKIN = 0xf2c9a0;
const RESTING_TINT = 0x8a8a8a;
const WALK_MS = 700;
const LABEL_ABOVE = 92;
const LOOT_COLOR = '#c8f0ff';
const BAD_COLOR = '#ffc2b8';

const GUILD_RECT = ROOM_SPOTS[GUILD_ROOM_ID]?.rect;
/** Heroes walk in and out through the left side of the guild hall. */
const doorX = (): number => (GUILD_RECT?.x ?? 0) + 14;

interface Shown {
  id: string;
  spot: Point;
  container: GameObjects.Container;
  body: GameObjects.Rectangle;
  hit: GameObjects.Rectangle;
  label: GameObjects.Text;
  mark: GameObjects.Text;
  /** What is on screen now; the view only redraws when it changes. */
  status: HeroStatus | 'none';
  seconds: number;
  walking: boolean;
}

/** A placeholder hero: body, head and gear (a sword for the warrior, a pointy hat for the mage). */
function createHero(scene: Scene, id: string, spot: Point, world: World): Shown {
  const look = LOOKS[id] ?? { body: 0x888888, gear: 0x444444 };
  const hit = scene.add.rectangle(0, -40, 50, 90, 0xffffff, 0.001);
  const body = scene.add.rectangle(0, -20, 28, 40, look.body);
  const head = scene.add.circle(0, -50, 12, SKIN);
  const gear = id === 'mage' ? scene.add.triangle(0, -66, -14, 6, 14, 6, 0, -18, look.gear) : scene.add.rectangle(20, -30, 6, 40, look.gear);
  // Above the countdown label, so it is seen while the player holds a drink for a resting hero.
  const mark = scene.add.text(0, -LABEL_ABOVE - 26, '▼', { fontFamily: 'sans-serif', fontSize: '18px', color: '#3fbf3f' }).setOrigin(0.5, 1).setVisible(false);
  const container = scene.add.container(spot.x, spot.y, [hit, body, head, gear, mark]).setVisible(false);
  const label = scene.add
    .text(spot.x, spot.y - LABEL_ABOVE, '', { fontFamily: 'sans-serif', fontSize: '15px', color: '#3b2410', backgroundColor: '#f2dfb0', padding: { x: 6, y: 3 } })
    .setOrigin(0.5, 1)
    .setVisible(false);
  hit.on('pointerdown', () => clickHero(world, id));
  world.targets.register(`hero:${id}`, () => (container.visible ? { x: spot.x - 25, y: spot.y - 85, w: 50, h: 85 } : null));
  return { id, spot, container, body, hit, label, mark, status: 'none', seconds: -1, walking: false };
}

function walk(scene: Scene, item: Shown, toX: number, toAlpha: number, done: () => void): void {
  item.walking = true;
  scene.tweens.add({
    targets: item.container,
    x: toX,
    alpha: toAlpha,
    duration: WALK_MS,
    onComplete: () => {
      item.walking = false;
      done();
    },
  });
}

/** Shows a hero as they are now: at home (clickable), resting (grey, clickable to heal) or away (only the countdown). */
function applyStatus(item: Shown, status: HeroStatus | 'none'): void {
  item.status = status;
  item.seconds = -1;
  const home = status === 'home' || status === 'injured';
  if (!item.walking) item.container.setVisible(home).setPosition(item.spot.x, item.spot.y).setAlpha(1);
  item.body.setFillStyle(status === 'injured' ? RESTING_TINT : (LOOKS[item.id]?.body ?? 0x888888));
  if (home) item.hit.setInteractive({ useHandCursor: true });
  else item.hit.disableInteractive();
  item.label.setVisible(status === 'away' || status === 'injured');
}

export interface GuildView {
  update(): void;
}

const POT = { w: 44, h: 26, glow: 0xfff36b, body: 0x2b2b33, rim: 0x45454f, brew: 0x7be05a } as const;
const BAR_W = 48;

/**
 * The hero cauldron between the heroes: shown once the guild hall stands. Click it to send the next ingredients there; it
 * glows while it is picked, shows what is in it and how far the brew is. Tutorial target `hero-cauldron`.
 */
function createHeroCauldron(scene: Scene, world: World): GuildView {
  const { x, y } = HERO_CAULDRON;
  const glow = scene.add.ellipse(x, y - 13, POT.w + 16, POT.h + 16, POT.glow, 0.7);
  const pot = scene.add.ellipse(x, y - 13, POT.w, POT.h, POT.body).setStrokeStyle(2, POT.rim);
  const brew = scene.add.ellipse(x, y - 24, POT.w - 10, 7, POT.brew);
  const track = scene.add.rectangle(x, y - 40, BAR_W, 6, 0x2a1a0c);
  const fill = scene.add.rectangle(x - BAR_W / 2, y - 40, 0, 6, POT.brew).setOrigin(0, 0.5);
  const dots = [-1, 0, 1].map((i) => scene.add.circle(x + i * 14, y - 36, 5, 0xffffff).setStrokeStyle(1, 0x2a1a0c));
  const zone = scene.add.zone(x, y - 14, POT.w + 12, POT.h + 18);
  zone.on('pointerdown', () => aimHeroCauldron(world));
  const parts = [glow, pot, brew, track, fill, ...dots];
  parts.forEach((p) => p.setVisible(false));
  let built = false;
  world.targets.register('hero-cauldron', () => (built ? { x: x - 30, y: y - 42, w: 60, h: 42 } : null));
  return {
    update() {
      const now = guildBuilt(world.store.getState());
      if (now !== built) {
        built = now;
        pot.setVisible(built);
        brew.setVisible(built);
        if (built) zone.setInteractive({ useHandCursor: true });
        else zone.disableInteractive();
      }
      if (!built) return;
      const { station, aimed } = world.guild;
      glow.setVisible(aimed);
      const brewing = station.brewing !== null;
      track.setVisible(brewing);
      fill.setVisible(brewing).setSize(BAR_W * brewProgress(station), 6);
      for (let i = 0; i < dots.length; i++) {
        const id = station.contents[i];
        const dot = dots[i];
        if (dot === undefined) continue;
        dot.setVisible(id !== undefined && !brewing);
        if (id !== undefined) dot.setFillStyle(ingredientColor(id));
      }
    },
  };
}

/** What floats up when a hero is back: the loot, the XP, the boss fight, gear, a new level and an injury. */
function returnLines(event: GameEvents['hero:returned']): { text: string; color: string }[] {
  const lines = Object.entries(event.loot).map(([id, n]) => ({ text: t('heroes.loot', { n, name: t(textKey('ingredients', id, 'name')) }), color: LOOT_COLOR }));
  lines.push({ text: t('heroes.xp_gained', { xp: event.xp }), color: GOLD_COLOR });
  const boss = t(textKey('bosses', BOSSES[event.dungeon]?.id ?? '', 'name'));
  if (event.boss !== null) lines.push({ text: t(event.boss === 'won' ? 'heroes.boss_won' : 'heroes.boss_lost', { boss }), color: event.boss === 'won' ? GOLD_COLOR : BAD_COLOR });
  if (event.gear !== null) lines.push({ text: t('gear.found', { name: t(textKey('gear', event.gear, 'name')) }), color: GOLD_COLOR });
  if (event.levelUp) lines.push({ text: t('heroes.level_up', { level: event.level }), color: GOLD_COLOR });
  if (event.injured) lines.push({ text: t('heroes.injured'), color: BAD_COLOR });
  return lines;
}

/**
 * The heroes in the guild hall: they stand there when at home, walk out when sent, and walk back in with loot.
 * Click a hero to open the Heroes tab, or (holding a drink from the bar) to heal them when they are injured.
 */
export function createGuildView(scene: Scene, world: World): GuildView {
  const floats = createFloatingTexts(scene);
  const shown = HERO_CLASSES.flatMap((def) => {
    const spot = HERO_SPOTS[def.id];
    return spot === undefined ? [] : [createHero(scene, def.id, spot, world)];
  });
  const find = (id: string): Shown | undefined => shown.find((s) => s.id === id);
  world.bus.on('hero:departed', ({ id }) => {
    const item = find(id);
    if (item !== undefined) walk(scene, item, doorX(), 0, () => item.container.setVisible(false));
  });
  world.bus.on('hero:returned', (event) => {
    const item = find(event.id);
    if (item === undefined) return;
    item.container.setVisible(true).setPosition(doorX(), item.spot.y).setAlpha(0);
    walk(scene, item, item.spot.x, 1, () => applyStatus(item, item.status));
    returnLines(event).forEach((line, i) => floats.show(item.spot.x, item.spot.y - LABEL_ABOVE - 10 - i * 20, line.text, { color: line.color, size: 16 }));
  });
  world.bus.on('hero:healed', ({ id }) => {
    const item = find(id);
    if (item !== undefined) floats.show(item.spot.x, item.spot.y - LABEL_ABOVE, t('heroes.healed'), { color: GOLD_COLOR });
  });
  world.bus.on('hero:drink', ({ id, recipeId }) => {
    const item = find(id);
    const drink = t(textKey('recipes', recipeId, 'name'));
    if (item !== undefined) floats.show(item.spot.x, item.spot.y - LABEL_ABOVE, t('heroes.in_bag', { drink }), { color: LOOT_COLOR, size: 16 });
  });
  world.bus.on('guild:aimed', ({ aimed }) => {
    floats.show(HERO_CAULDRON.x, HERO_CAULDRON.y - 50, t(aimed ? 'heroes.cauldron_aimed' : 'heroes.cauldron_tavern'), { color: GOLD_COLOR, size: 15 });
  });
  const cauldron = createHeroCauldron(scene, world);

  return {
    update() {
      cauldron.update();
      const state = world.store.getState();
      const now = world.clock.now();
      const picked = world.selection.selected() !== null;
      for (const item of shown) {
        const hero = state.heroes[item.id];
        const status = hero === undefined ? 'none' : heroStatus(hero, now);
        if (status !== item.status) applyStatus(item, status);
        item.mark.setVisible(status === 'injured' && picked);
        if (hero === undefined || (status !== 'away' && status !== 'injured')) continue;
        const seconds = Math.ceil(heroWaitMs(hero, now) / 1000);
        if (seconds === item.seconds) continue;
        item.seconds = seconds;
        item.label.setText(t(status === 'away' ? 'heroes.scene_away' : 'heroes.scene_injured', { time: clockText(seconds * 1000) }));
      }
    },
  };
}
