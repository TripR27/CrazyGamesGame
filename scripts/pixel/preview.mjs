import { mkdirSync, writeFileSync } from 'node:fs';
import { drawBackdrop, drawBar, drawTable } from './backdrop.mjs';
import { blit, createCanvas, fillRect, upscale } from './canvas.mjs';
import { encodePng } from './png.mjs';
import { flipHorizontal, parseSprite } from './sprite.mjs';
import { cauldron as cauldronData } from './sprites/cauldron.mjs';
import { knight as knightData } from './sprites/knight.mjs';

const OUT_DIR = 'art/pixel';
const SCALE = 4;

const cauldron = parseSprite('cauldron', cauldronData);
const knight = parseSprite('knight', knightData);

function composeTavern() {
  const canvas = createCanvas(320, 180);
  drawBackdrop(canvas);
  drawTable(canvas, 65);
  drawTable(canvas, 125);
  drawBar(canvas);
  blit(canvas, cauldron, 178, 143 - cauldron.height);
  blit(canvas, knight, 49, 146 - knight.height);
  blit(canvas, flipHorizontal(knight), 154, 146 - knight.height);
  return canvas;
}

function composeSpriteSheet() {
  const sheet = createCanvas(64, 32);
  fillRect(sheet, 0, 0, 64, 32, 0x2a1a0c);
  blit(sheet, cauldron, 4, 6);
  blit(sheet, knight, 38, 4);
  return sheet;
}

function write(name, canvas, factor) {
  writeFileSync(`${OUT_DIR}/${name}`, encodePng(factor > 1 ? upscale(canvas, factor) : canvas));
}

mkdirSync(OUT_DIR, { recursive: true });
write('tavern-preview-4x.png', composeTavern(), SCALE);
write('sprites-12x.png', composeSpriteSheet(), 12);
console.log(`wrote previews to ${OUT_DIR}/`);
