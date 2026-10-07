import { BUILDING, DOOR, FLOOR_Y, GROUND_Y } from '@/scene/layout';
import { PALETTE } from '@/scene/palette';
import { fillRect, type Graphics } from '@/scene/sprites/draw';

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
