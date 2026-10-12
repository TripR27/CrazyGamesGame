import { CUSTOMER_FRAME, figureFrames, type Look } from '@/customers/customer-art';
import { mirrored, type Sprite, withPixels } from '@/shared/pixels';

/**
 * The heroes and the hero cauldron in pixel art (see shared/pixels.ts). The heroes are figures like the customers
 * (same legs and poses) with their weapon drawn on top; the guild hall shows them standing, blinking and walking.
 */
type Points = readonly (readonly [number, number, string])[];

interface HeroLook extends Look {
  /** The weapon, drawn over every frame. */
  weapon: Points;
}

const range = (from: number, to: number): number[] => Array.from({ length: to - from + 1 }, (_, i) => from + i);

const LOOKS: Readonly<Record<string, HeroLook>> = {
  // The warrior: a horned helmet, a red tunic and a sword.
  warrior: {
    palette: { a: 0x9aa4b2, A: 0x6a7484, h: 0xf2e6c8, v: 0xb8c0cc, c: 0xb03a2e, C: 0x8a2a20, d: 0x5e3a18, p: 0x4a3a2a, b: 0x3b2410, x: 0xd8dce4, g: 0xf5c542 },
    head: ['.......', '.h.....', '.h.kkkk', '.hkaaaa', '..kaaaa', '..kAAAA', '..kAses', '..kssss', '...kssm', '....kkk'],
    body: ['.kaaccc', '.kvkccc', '.kvkcCc', '.kvkccc', '.kskddd', '..kcccc', '..kcCcc'],
    weapon: [...range(3, 12).map((y) => [13, y, 'x'] as const), [12, 13, 'g'], [13, 13, 'g'], [13, 14, 'd']],
  },
  // The mage: a pointy hat with a star, a white beard, a blue robe and a staff with an orb.
  mage: {
    palette: { t: 0x3b5bb5, T: 0x2a3f8a, y: 0xf5c542, w: 0xe8e8f0, W: 0xb8b8c8, v: 0x3b5bb5, c: 0x3b5bb5, C: 0x2a3f8a, d: 0xf5c542, p: 0x2a3f8a, b: 0x3b2410, x: 0x8b5a2b, o: 0x7ae0ff },
    head: ['......t', '.....tt', '....ttt', '...ttyt', '.kttttt', '..kssss', '..ksses', '..kwsss', '..kwwwm', '...kwww'],
    body: ['.kvwwww', '.kvkwww', '.kvkcww', '.kvkccc', '.kskddd', '..kcccc', '..kcCcc'],
    weapon: [[0, 1, 'o'], [0, 2, 'o'], [1, 2, 'o'], ...range(3, 20).map((y) => [0, y, 'x'] as const)],
  },
};

/** Frame numbers in a hero strip. */
export const HERO_FRAME = { stand: 0, blink: 1, walkA: 2, walkB: 3 } as const;

/** The frames of a hero class (standing, blinking and two walking frames); empty for a class without art. */
export function heroFrames(id: string): Sprite[] {
  const look = LOOKS[id];
  if (look === undefined) return [];
  const all = figureFrames(look);
  const F = CUSTOMER_FRAME;
  return [F.stand, F.blink, F.walkA, F.walkB].flatMap((i) => {
    const frame = all[i];
    return frame === undefined ? [] : [withPixels(frame, look.weapon)];
  });
}

export const HERO_LOOKS = Object.keys(LOOKS);

const POT_PALETTE = { k: 0x1a1a22, d: 0x2b2b33, m: 0x45454f, h: 0x6a6a78, g: 0x7be05a, b: 0xd4ffb0 } as const;

const POT = mirrored(POT_PALETTE, [
  '........',
  '..kkkkkk',
  '.kmmmmmm',
  '.kmggggg',
  '..kkkkkk',
  '.kdhdddd',
  'kdhddddd',
  'kddddddd',
  '.kdddddd',
  '..kkkkkk',
  '...k....',
]);

/** The small hero cauldron in the guild hall: simmering (frames 0-1) and boiling (frames 2-3). */
export const HERO_POT_FRAMES: readonly Sprite[] = [
  withPixels(POT, [[5, 3, 'b']]),
  withPixels(POT, [[10, 3, 'b']]),
  withPixels(POT, [[4, 3, 'b'], [9, 2, 'b'], [12, 3, 'b'], [7, 0, 'b']]),
  withPixels(POT, [[6, 2, 'b'], [11, 3, 'b'], [10, 0, 'b'], [3, 3, 'b']]),
];
