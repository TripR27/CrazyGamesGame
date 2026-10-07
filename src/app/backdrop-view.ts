import type { GameObjects } from 'phaser';
import { type Rect, BUILDING, DOOR, FLOOR_Y, GROUND_Y, PALETTE, SHELF, TABLES, BAR, CAULDRON, CUSTOMER_SLOTS } from '@/app/layout';

export type Graphics = GameObjects.Graphics;

export function fillRect(g: Graphics, rect: Rect, color: number): void {
  g.fillStyle(color, 1);
  g.fillRect(rect.x, rect.y, rect.w, rect.h);
}

const PLANK_WIDTH = 120;
const GAME_BOTTOM = 720;

function drawFloorLines(g: Graphics): void {
  g.lineStyle(2, PALETTE.floorLine, 1);
  for (let x = BUILDING.x + PLANK_WIDTH; x < BUILDING.x + BUILDING.w; x += PLANK_WIDTH) {
    g.lineBetween(x, FLOOR_Y, x, GROUND_Y);
  }
}

function drawDoor(g: Graphics): void {
  fillRect(g, DOOR, PALETTE.door);
  g.fillStyle(PALETTE.doorKnob, 1);
  g.fillCircle(DOOR.x + DOOR.w - 16, DOOR.y + DOOR.h / 2, 5);
}

/** Outside strip, back wall, wooden floor and the front door. */
export function drawRoomShell(g: Graphics): void {
  fillRect(g, { x: 0, y: GROUND_Y, w: 1280, h: GAME_BOTTOM - GROUND_Y }, PALETTE.ground);
  fillRect(g, BUILDING, PALETTE.wall);
  fillRect(g, { x: BUILDING.x, y: BUILDING.y, w: BUILDING.w, h: 16 }, PALETTE.wallShade);
  fillRect(g, { x: BUILDING.x, y: FLOOR_Y, w: BUILDING.w, h: GROUND_Y - FLOOR_Y }, PALETTE.floor);
  drawFloorLines(g);
  drawDoor(g);
}

const BRACKET_WIDTH = 8;
const BRACKET_HEIGHT = 18;

/** The empty wall shelf; the ingredients on it are interactive objects of the shelf view. */
export function drawShelf(g: Graphics): void {
  fillRect(g, SHELF, PALETTE.woodDark);
  for (const x of [SHELF.x + 30, SHELF.x + SHELF.w - 30 - BRACKET_WIDTH]) {
    fillRect(g, { x, y: SHELF.y + SHELF.h, w: BRACKET_WIDTH, h: BRACKET_HEIGHT }, PALETTE.woodDark);
  }
}

const LEG_WIDTH = 10;
const LEG_INSET = 12;

/** Plain tables: a top plank on two legs. */
export function drawTables(g: Graphics): void {
  for (const table of TABLES) {
    const legHeight = FLOOR_Y - (table.y + table.h);
    const legY = table.y + table.h;
    fillRect(g, { x: table.x + LEG_INSET, y: legY, w: LEG_WIDTH, h: legHeight }, PALETTE.woodDark);
    fillRect(g, { x: table.x + table.w - LEG_INSET - LEG_WIDTH, y: legY, w: LEG_WIDTH, h: legHeight }, PALETTE.woodDark);
    fillRect(g, table, PALETTE.barTop);
  }
}

const TOP_THICKNESS = 14;

/** The bar counter. Finished drinks are drawn on top of it by the ready view. */
export function drawBar(g: Graphics): void {
  fillRect(g, BAR, PALETTE.wood);
  fillRect(g, { x: BAR.x, y: BAR.y, w: BAR.w, h: TOP_THICKNESS }, PALETTE.barTop);
  fillRect(g, { x: BAR.x, y: BAR.y + BAR.h - 10, w: BAR.w, h: 10 }, PALETTE.woodDark);
}

const BODY_HEIGHT = 80;
const RIM_HEIGHT = 24;

function drawFire(g: Graphics, cx: number): void {
  g.fillStyle(PALETTE.fireOuter, 1);
  g.fillTriangle(cx - 40, FLOOR_Y, cx - 15, FLOOR_Y - 30, cx + 5, FLOOR_Y);
  g.fillTriangle(cx - 10, FLOOR_Y, cx + 12, FLOOR_Y - 36, cx + 40, FLOOR_Y);
  g.fillStyle(PALETTE.fireInner, 1);
  g.fillTriangle(cx - 22, FLOOR_Y, cx - 12, FLOOR_Y - 16, cx - 2, FLOOR_Y);
  g.fillTriangle(cx + 6, FLOOR_Y, cx + 14, FLOOR_Y - 18, cx + 24, FLOOR_Y);
}

/** The brewing cauldron over a small fire. */
export function drawCauldron(g: Graphics): void {
  const cx = CAULDRON.x + CAULDRON.w / 2;
  const bodyY = FLOOR_Y - 30 - BODY_HEIGHT / 2;
  drawFire(g, cx);
  g.fillStyle(PALETTE.cauldron, 1);
  g.fillEllipse(cx, bodyY, CAULDRON.w, BODY_HEIGHT);
  g.fillStyle(PALETTE.cauldronRim, 1);
  g.fillEllipse(cx, bodyY - BODY_HEIGHT / 2 + 8, CAULDRON.w - 8, RIM_HEIGHT);
  g.fillStyle(PALETTE.brew, 1);
  g.fillEllipse(cx, bodyY - BODY_HEIGHT / 2 + 8, CAULDRON.w - 28, RIM_HEIGHT - 8);
}

const MARKER_WIDTH = 56;
const MARKER_HEIGHT = 16;

/** Faint outlines showing where customers will sit (step 6). */
export function drawCustomerSlots(g: Graphics): void {
  g.lineStyle(2, PALETTE.slot, 0.45);
  for (const slot of CUSTOMER_SLOTS) {
    g.strokeEllipse(slot.x, slot.y, MARKER_WIDTH, MARKER_HEIGHT);
  }
}
