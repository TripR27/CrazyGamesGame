import { fillRect, setPixel } from './canvas.mjs';

const C = {
  outside: 0x2a1a0c, wall: 0xb98a5a, plank: 0xa57849, beam: 0x6b4423, floor: 0x6b4423,
  floorLight: 0x8b5a2b, seam: 0x573718, grass: 0x3f6b3a, grassLight: 0x4f8148,
  door: 0x4a2c14, doorDark: 0x3a200c, knob: 0xf5c542, frame: 0x5e3a18, sky: 0x1c2a5a,
  moon: 0xfff2cc, wood: 0x8b5a2b, woodDark: 0x5e3a18, woodSeam: 0x6e4720, top: 0xc58b4a,
  mug: 0xd9a441, foam: 0xfff2cc,
};

function drawBuilding(canvas) {
  fillRect(canvas, 0, 0, 320, 180, C.outside);
  fillRect(canvas, 10, 20, 300, 120, C.wall);
  for (let y = 30; y < 140; y += 10) fillRect(canvas, 10, y, 300, 1, C.plank);
  fillRect(canvas, 10, 20, 300, 4, C.beam);
  fillRect(canvas, 10, 140, 300, 20, C.floor);
  fillRect(canvas, 10, 140, 300, 1, C.floorLight);
  for (let x = 40; x < 310; x += 30) fillRect(canvas, x, 141, 1, 19, C.seam);
  fillRect(canvas, 0, 160, 320, 20, C.grass);
  for (let y = 160; y < 180; y++) {
    for (let x = 0; x < 320; x++) if ((x * 7 + y * 13) % 11 === 0) setPixel(canvas, x, y, C.grassLight);
  }
}

function drawDoor(canvas) {
  fillRect(canvas, 17, 100, 23, 40, C.door);
  for (const x of [23, 29, 35]) fillRect(canvas, x, 100, 1, 40, C.doorDark);
  fillRect(canvas, 36, 120, 2, 2, C.knob);
}

function drawWindow(canvas) {
  fillRect(canvas, 128, 44, 34, 30, C.frame);
  fillRect(canvas, 131, 47, 28, 24, C.sky);
  fillRect(canvas, 144, 47, 2, 24, C.frame);
  fillRect(canvas, 131, 58, 28, 2, C.frame);
  for (const [x, y] of [[134, 50], [153, 52], [135, 64], [150, 66]]) setPixel(canvas, x, y, C.moon);
  fillRect(canvas, 148, 50, 4, 4, C.moon);
}

/** Wall, floor, door, window and the grass outside, drawn at 320x180. */
export function drawBackdrop(canvas) {
  drawBuilding(canvas);
  drawDoor(canvas);
  drawWindow(canvas);
}

export function drawTable(canvas, x) {
  fillRect(canvas, x + 3, 129, 2, 11, C.woodDark);
  fillRect(canvas, x + 25, 129, 2, 11, C.woodDark);
  fillRect(canvas, x, 126, 30, 3, C.top);
}

export function drawBar(canvas) {
  fillRect(canvas, 215, 117, 95, 23, C.wood);
  for (let x = 227; x < 310; x += 12) fillRect(canvas, x, 120, 1, 16, C.woodSeam);
  fillRect(canvas, 215, 117, 95, 3, C.top);
  fillRect(canvas, 215, 136, 95, 4, C.woodDark);
  for (const x of [225, 250, 275]) {
    fillRect(canvas, x, 112, 4, 5, C.mug);
    fillRect(canvas, x, 111, 4, 1, C.foam);
    fillRect(canvas, x + 4, 113, 1, 2, C.mug);
  }
}
