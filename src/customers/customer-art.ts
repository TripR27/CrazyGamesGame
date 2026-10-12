import { mirrored, type Sprite, swapChars, withPixels } from '@/shared/pixels';

/**
 * The customers in pixel art (see shared/pixels.ts): 14×22 art pixels, built from a head and a body per type (drawn as
 * left halves and mirrored) on shared legs. Every type uses the same letters for the parts the poses change: `s` skin,
 * `e` eyes, `m` mouth, `q` an angry red face, `v` sleeves, `p` trousers, `b` boots, and `u`/`f` for the mug, so one set of poses fits them all.
 */
type Palette = Readonly<Record<string, number>>;

const SHARED: Palette = { k: 0x1a1a22, e: 0x1a1a22, m: 0x8a4a2a, u: 0xd9a441, f: 0xfff2cc, s: 0xf2c9a0, q: 0xf08a7a };

interface Look {
  palette: Palette;
  head: readonly string[];
  body: readonly string[];
}

const LOOKS: Readonly<Record<string, Look>> = {
  // Sir Dents-a-Lot: helmet with a red plume, armour and a red tabard.
  knight: {
    palette: { a: 0xb8c0cc, A: 0x7a8494, r: 0xd23a3a, v: 0x9aa4b2, c: 0xd23a3a, C: 0xa82a2a, d: 0x6b3a14, p: 0x5a6270, b: 0x5e3a18 },
    head: ['......r', '.....rr', '...kkkk', '..kaaaa', '..kaaAa', '..kAsss', '..kAses', '..kAsss', '...kAsm', '....kkk'],
    body: ['.kaaaaa', '.kvkccc', '.kvkcCc', '.kvkccc', '.kskccc', '..kdddd', '..kcccc'],
  },
  // A slender elf: blond hair, pointy ears and a green tunic.
  elf: {
    palette: { s: 0xf5d6b4, e: 0x2f5530, h: 0xf2d16b, H: 0xc9a23a, v: 0x3f9a4a, c: 0x3f9a4a, C: 0x2f7a38, d: 0x7a5a3a, p: 0x5a4a3a, b: 0x4a3424 },
    head: ['.......', '....kkk', '...khhh', '..khhhh', '..khHhh', '.skhsss', '..ssses', '..khsss', '...kssm', '....kkk'],
    body: ['.kvcccc', '.kvkcCc', '.kvkccc', '.kvkcCc', '.kskddd', '..kcccc', '..kcCcc'],
  },
  // A stocky dwarf: iron helmet, a big ginger beard over the chest, strong arms.
  dwarf: {
    palette: { a: 0x8a8a96, A: 0x6a6a78, h: 0xd9702a, H: 0xa8501a, n: 0xe8a080, v: 0x8a5a3a, c: 0x6b4a8a, C: 0x4a3a6a, d: 0x3b2410, p: 0x4a3a2a, b: 0x2b1a10 },
    head: ['.......', '.......', '...kkkk', '..kaaaa', '.kaaaAa', '.kkkkkk', '..ksses', '..khhhn', '.khhhhh', '.khhHhh'],
    body: ['.khhhhh', 'kvvkhHh', 'kvvkchh', 'kvvkccc', 'ksskddd', '.kccccc', '.kcCccc'],
  },
  // The king (a VIP): a jewelled crown, a white beard and a purple robe with ermine and gold.
  king: {
    palette: { g: 0xf5c542, j: 0xd23a3a, h: 0xe8e8f0, H: 0xb8b8c8, w: 0xf2f2e6, x: 0x1a1a22, v: 0x7a2a8a, c: 0x7a2a8a, C: 0x5a1a6a, d: 0xf5c542, p: 0x5a1a6a, b: 0x3a2a1a },
    head: ['...g..g', '...gjgg', '..kgggg', '..khsss', '..khsss', '..khsss', '..khses', '..khhss', '..khhhm', '...khhh'],
    body: ['.kwwxww', '.kvkccc', '.kvkccd', '.kvkccd', '.kskccd', '..kdddd', '..kCccd'],
  },
};

const LEGS = {
  stand: ['...kppkkppk...', '...kppkkppk...', '...kppkkppk...', '..kbbbkkbbbk..', '..kkkkkkkkkk..'],
  // Walking towards the viewer: one foot lifted, then the other (the second frame is the first mirrored).
  walk: ['...kppkkppk...', '...kppkkppk...', '...kbbkkppk...', '...kkkkkbbbk..', '.......kkkkk..'],
  // Sitting on a stool: the lap, then the shins hanging down.
  sit: ['..kppppppppk..', '..kpppkkpppk..', '...kpk..kpk...', '...kbk..kbk...', '..kbbk..kbbk..'],
} as const;

const mirrorRows = (rows: readonly string[]): string[] => rows.map((row) => [...row].reverse().join(''));

function figure(look: Look, legs: readonly string[]): Sprite {
  const palette = { ...SHARED, ...look.palette };
  const upper = mirrored(palette, [...look.head, ...look.body]);
  return { palette, rows: [...upper.rows, ...legs] };
}

type Points = readonly (readonly [number, number, string])[];

/** Clears the right arm (columns 11-12, rows 10-14), so a pose can draw it elsewhere. */
const NO_RIGHT_ARM: Points = [10, 11, 12, 13, 14].flatMap((y) => [[11, y, '.'], [12, y, '.']] as const);
const NO_LEFT_ARM: Points = [10, 11, 12, 13, 14].flatMap((y) => [[1, y, '.'], [2, y, '.']] as const);
const MUG_AT_SIDE: Points = [[11, 11, 'f'], [12, 11, 'f'], [11, 12, 'u'], [12, 12, 'u'], [13, 12, 'k'], [11, 13, 'u'], [12, 13, 'u']];
const MUG_AT_MOUTH: Points = [...NO_RIGHT_ARM, [8, 7, 'f'], [9, 7, 'f'], [8, 8, 'u'], [9, 8, 'u'], [8, 9, 'u'], [9, 9, 'u'], [10, 9, 's'], [10, 10, 'v'], [11, 10, 'v']];
const ARMS_UP: Points = [...NO_LEFT_ARM, ...NO_RIGHT_ARM, [1, 8, 's'], [2, 9, 'v'], [2, 10, 'v'], [12, 8, 's'], [11, 9, 'v'], [11, 10, 'v'], [5, 8, 'm'], [8, 8, 'm']];
const BROWS_DOWN: Points = [[5, 5, 'k'], [8, 5, 'k'], [4, 4, 'k'], [9, 4, 'k']];

/** Frame numbers in every customer strip. */
export const CUSTOMER_FRAME = { stand: 0, blink: 1, walkA: 2, walkB: 3, sit: 4, sitBlink: 5, drinkLow: 6, drinkHigh: 7, happy: 8, angry: 9 } as const;

/** All frames of one customer type, in the order of `CUSTOMER_FRAME`. */
export function customerFrames(typeId: string): Sprite[] {
  const look = LOOKS[typeId] ?? LOOKS.knight;
  if (look === undefined) return [];
  const stand = figure(look, LEGS.stand);
  const walk = figure(look, LEGS.walk);
  const sit = figure(look, LEGS.sit);
  const blink = (sprite: Sprite): Sprite => swapChars(sprite, { e: 's' });
  return [
    stand,
    blink(stand),
    walk,
    { palette: walk.palette, rows: [...walk.rows.slice(0, -LEGS.walk.length), ...mirrorRows(LEGS.walk)] },
    sit,
    blink(sit),
    withPixels(sit, MUG_AT_SIDE),
    withPixels(sit, MUG_AT_MOUTH),
    withPixels(sit, ARMS_UP),
    // Angry: brows down and a red face.
    swapChars(withPixels(sit, BROWS_DOWN), { s: 'q' }),
  ];
}

/** The customer types that have their own look; any other type is drawn as the knight. */
export const CUSTOMER_LOOKS = Object.keys(LOOKS);
