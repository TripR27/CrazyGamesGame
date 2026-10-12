import { mirrored, type Sprite, withPixels } from '@/shared/pixels';

/**
 * The brewing art as pixel sprites (see shared/pixels.ts). The cauldron is the grumpy mascot of the tutorial: heavy brows
 * and cross eyes. Its frames only differ in the bubbles; the fire under it flickers in three frames.
 */
const CAULDRON_PALETTE = {
  k: 0x1a1a22, d: 0x2b2b33, m: 0x45454f, h: 0x6a6a78, w: 0xf2f2e6,
  g: 0x7be05a, G: 0xb6f58f, b: 0xd4ffb0, B: 0xeaffdc,
} as const;

const CAULDRON_BASE = mirrored(CAULDRON_PALETTE, [
  '................',
  '................',
  '................',
  '................',
  '....kkkkkkkkkkkk',
  '..kkmmmmmmmmmmmm',
  '.kmmgGgggggggggg',
  '.kmmgggggggggggg',
  '..kkmmmmmmmmmmmm',
  '.kdkkkkkkkkkkkkk',
  'kddhhddddddddddd',
  'kdhhdddkkddddddd',
  'kdhddddddkkkdddd',
  'kdhdddddwwkddddd',
  'kdddddddwwwddddd',
  'kddddddddddddddd',
  'kddddddddddddddd',
  '.kdddddddddddkkk',
  '.kkdddddddddkddd',
  '..kkdddddddddddd',
  '....kkkkkkkkkkkk',
  '.....kk.........',
  '.....kk.........',
  '.....kk.........',
  '.....kk.........',
  '....kkk.........',
]);

type Points = readonly (readonly [number, number, string])[];
const bubbles = (points: Points): Sprite => withPixels(CAULDRON_BASE, points);

/** Frames 0-3: a calm simmer. Frames 4-6: boiling while a drink brews, with drops jumping over the rim. */
export const CAULDRON_FRAMES: readonly Sprite[] = [
  bubbles([[10, 6, 'b'], [21, 7, 'b']]),
  bubbles([[11, 6, 'B'], [22, 6, 'b'], [15, 7, 'b']]),
  bubbles([[11, 5, 'b'], [23, 7, 'b'], [16, 6, 'b']]),
  bubbles([[17, 6, 'B'], [24, 6, 'b'], [8, 7, 'b']]),
  bubbles([[8, 6, 'B'], [9, 6, 'B'], [14, 5, 'b'], [20, 6, 'B'], [21, 6, 'B'], [25, 7, 'b']]),
  bubbles([[9, 4, 'b'], [15, 6, 'B'], [16, 6, 'B'], [22, 3, 'b'], [24, 6, 'b'], [11, 7, 'b']]),
  bubbles([[9, 2, 'b'], [22, 1, 'b'], [18, 6, 'B'], [19, 6, 'B'], [7, 7, 'b'], [26, 6, 'b'], [13, 3, 'b']]),
];
export const CAULDRON_SIMMER = [0, 1, 2, 3] as const;
export const CAULDRON_BOIL = [4, 5, 6] as const;

const FIRE_PALETTE = { o: 0xe8641a, y: 0xf5c542, w: 0xfff2cc, r: 0xb03a10 } as const;

export const FIRE_FRAMES: readonly Sprite[] = [
  ['......o.........', '..o..oyo....o...', '..oo.oyyo..oyo..', '.oyyooyyyooyyyo.', 'oyyyyywwyyyyyyyo', 'rroooooooooooorr'],
  ['.........o......', '...o....oyo..o..', '..oyo..oyyo.oyo.', '.oyyyooyyyyooyyo', 'oyyywwyyyyywyyyo', 'rroooooooooooorr'],
  ['....o......o....', '...oyo....oyo...', '.o.oyyo..oyyo.o.', '.oyoyyyooyyyoyo.', 'oyyyywwyyywwyyyo', 'rroooooooooooorr'],
].map((rows) => ({ palette: FIRE_PALETTE, rows }));

/** A wooden tankard with foam: the finished drink on the bar and in a customer's hand. */
export const MUG: Sprite = {
  palette: { k: 0x3b2410, y: 0xd9a441, Y: 0xf5d27a, b: 0x8a6a3a, f: 0xfff2cc, F: 0xe8d8a8 },
  rows: [
    '.ffffffff...',
    'fFffffffFf..',
    'kyYyyyyyyk..',
    'kyYyyyyyykkk',
    'kbbbbbbbbk.k',
    'kyYyyyyyyk.k',
    'kyYyyyyyyk.k',
    'kyYyyyyyykkk',
    'kbbbbbbbbk..',
    'kyYyyyyyyk..',
    '.kkkkkkkk...',
  ],
};
