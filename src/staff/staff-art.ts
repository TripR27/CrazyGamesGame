import { mirrored, type Sprite, swapChars, withPixels } from '@/shared/pixels';

/**
 * The staff's corner at the end of the bar, in pixel art (see shared/pixels.ts): the brewer behind the counter (only the
 * upper body shows, so the sprite ends at the counter top), the brewer's own little kettle on a brazier on the counter,
 * and the slop bucket on the floor in front of the bar.
 */

/** The brewer: a flat cap, a big moustache, green sleeves and a white apron. 14×17, from the cap to the counter. */
const BREWER = mirrored(
  { k: 0x1a1a22, s: 0xf2c9a0, e: 0x1a1a22, c: 0x8a3a2a, C: 0x6a2a1a, h: 0x5e3a18, v: 0x3f7a4a, w: 0xf2f2e6, W: 0xc8c8bc },
  [
    '.......',
    '...kkkk',
    '..kcccc',
    '.kccCcc',
    '.kkkkkk',
    '..kssss',
    '..ksses',
    '..khsss',
    '...khhh',
    '....kkk',
    '.kvwwww',
    '.kvkwWw',
    '.kvkwww',
    '.kvkwWw',
    '.kskwww',
    '..kwwww',
    '..kwwww',
  ],
);

/** The right arm (columns 11-12, rows 10-14) cleared, so a stirring pose can draw it reaching into the kettle. */
const NO_RIGHT_ARM = [10, 11, 12, 13, 14].flatMap((y) => [[11, y, '.'], [12, y, '.']] as const);
const LADLE = { l: 0x8a8a96 } as const;
const stir = (points: readonly (readonly [number, number, string])[]): Sprite => {
  const posed = withPixels(BREWER, [...NO_RIGHT_ARM, ...points]);
  return { palette: { ...posed.palette, ...LADLE }, rows: posed.rows };
};

/** Frames: stand, blink, and two stirring poses (the ladle up, then down in the kettle). */
export const BREWER_FRAMES: readonly Sprite[] = [
  BREWER,
  swapChars(BREWER, { e: 's' }),
  stir([[11, 10, 'v'], [12, 10, 'v'], [13, 10, 's'], [13, 9, 'l'], [13, 8, 'l']]),
  stir([[11, 11, 'v'], [12, 11, 'v'], [13, 11, 's'], [13, 10, 'l'], [13, 12, 'l']]),
];
export const BREWER_FRAME = { stand: 0, blink: 1, stirA: 2, stirB: 3 } as const;

/** The kettle on a small brazier: 12×12. Its frames only differ in the bubbles over the rim. */
const KETTLE = mirrored(
  { k: 0x1a1a22, m: 0x6a6a78, g: 0x7be05a, d: 0x2b2b33, h: 0x45454f, o: 0xe8641a, y: 0xf5c542, b: 0xd4ffb0 },
  [
    '......',
    '......',
    '.kkkkk',
    'kmgggg',
    'kkkkkk',
    'kddddd',
    'kdhddd',
    'kdhddd',
    '.kdddd',
    '..kkkk',
    '.kooyo',
    '.kkkkk',
  ],
);

const bubbles = (points: readonly (readonly [number, number, string])[]): Sprite => withPixels(KETTLE, points);

/** Frames 0-1: a calm simmer. Frames 2-4: boiling while the brewer's drink brews. */
export const KETTLE_FRAMES: readonly Sprite[] = [
  bubbles([[4, 3, 'b']]),
  bubbles([[7, 3, 'b']]),
  bubbles([[3, 1, 'b'], [6, 3, 'b'], [8, 2, 'b']]),
  bubbles([[5, 0, 'b'], [8, 3, 'b'], [3, 2, 'b']]),
  bubbles([[7, 0, 'b'], [4, 3, 'b'], [9, 1, 'b']]),
];
export const KETTLE_SIMMER = [0, 1] as const;
export const KETTLE_BOIL = [2, 3, 4] as const;

/** A wooden slop bucket with a rope handle, iron bands and something murky inside: 10×10. */
export const BUCKET: Sprite = mirrored(
  { k: 0x2b1a10, s: 0x6b7a3a, S: 0x8a9a4a, i: 0x45454f, w: 0x8b5a2b, W: 0xc58b4a },
  [
    '..kkk',
    '.k...',
    'kkkkk',
    'kssSs',
    'kiiii',
    'kwwWw',
    '.kwWw',
    '.kiii',
    '.kwWw',
    '..kkk',
  ],
);
