import type { Sprite } from '@/shared/pixels';

/**
 * The ingredients on the shelf in pixel art (10×11 art pixels each, see shared/pixels.ts). A new ingredient is one entry;
 * one without art is drawn as a plain jar.
 */
const K = 0x1a1a22;

const JAR: Sprite = {
  palette: { k: K, c: 0xa5683a, g: 0xc8e8f0, G: 0x9ab8c4 },
  rows: ['...kkkk...', '...kcck...', '..kkkkkk..', '.kggggggk.', '.kgGggggk.', '.kGgggggk.', '.kggggggk.', '.kggggGgk.', '.kgggGggk.', '.kggggggk.', '..kkkkkk..'],
};

export const INGREDIENT_ART: Readonly<Record<string, Sprite>> = {
  // A corked jar of green slime.
  swamp_slime: {
    palette: { k: K, c: 0xa5683a, g: 0xc8e8f0, G: 0x7be05a, H: 0xb6f58f, D: 0x4a9a3a },
    rows: ['...kkkk...', '...kcck...', '..kkkkkk..', '.kggggggk.', '.kgHGGGgk.', '.kHGGGGGk.', '.kGGDGGGk.', '.kGGGGDGk.', '.kGDGGGGk.', '.kGGGGGGk.', '..kkkkkk..'],
  },
  // A clay honey pot, dripping, with a dipper.
  wild_honey: {
    palette: { k: K, y: 0xf5c542, Y: 0xffe08a, o: 0xc9763a, O: 0xa5582a, w: 0xfff2cc },
    rows: ['......k...', '..yyyyky..', '.kyYyyyyk.', '.kooooook.', 'kooOoooook', 'koywwwwook', 'koywwwwook', 'kooOoooook', 'kOooooooOk', '.kOOOOOOk.', '..kkkkkk..'],
  },
  // A glowing cyan mushroom with white spots.
  glowcap: {
    palette: { k: K, c: 0x58d6d0, C: 0x2fa8a2, s: 0xe8fffe, t: 0xf2e6c8, T: 0xc8b898, g: 0xa8fff8 },
    rows: ['...kkkk...', '..kcscck..', '.kccccsck.', 'kcsccccsck', 'kCCCCCCCCk', '.kkktTkkk.', '...ktTk...', '...ktTk...', '..kttTTk..', '.gkttttkg.', '..kkkkkk..'],
  },
  // A curved red chili with a green stem.
  fire_pepper: {
    palette: { k: K, r: 0xe2563b, R: 0xb03a2a, w: 0xffb0a0, g: 0x4f8148 },
    rows: ['.......k..', '......kgk.', '.....kggk.', '....krrk..', '...krwrk..', '..krwrrk..', '..krrrrk..', '.krrrRk...', '.krrRRk...', '.kRRk.....', '..kk......'],
  },
  // A bunch of purple grapes with a moonlit glint.
  moon_grape: {
    palette: { k: K, p: 0x7a5fd1, P: 0x5a3fa8, w: 0xd8ccff, g: 0x4f8148, b: 0x6b4423 },
    rows: ['..........', '....kb....', '...kbggk..', '..kppkppk.', '.kpwppwpPk', '.kpPkppPk.', '..kpwpwpPk', '..kpPkpPk.', '...kpwPk..', '...kpPk...', '....kk....'],
  },
  // A murky flask with a smell you can see.
  troll_sweat: {
    palette: { k: K, g: 0xc8e8f0, m: 0x9aa86a, M: 0x6a7848, c: 0xa5683a, s: 0x9aa86a },
    rows: ['.s...kk...', 's.s.kcck..', '.s..kggk..', '....kggk..', '..kkgggkk.', '.kgmmmmmgk', '.kgmMmmmmk', '.kmmmmMmmk', '.kmMmmmmmk', '.kmmmmmmmk', '..kkkkkkk.'],
  },
  // A white pearl in an open shell.
  bog_pearl: {
    palette: { k: K, w: 0xf2f0fa, W: 0xc8c4dc, h: 0xffffff, s: 0x8ab0a0, S: 0x5a8070 },
    rows: ['..........', '..........', '...kkkk...', '..kwhwwk..', '..kwwwWk..', '..kwwWWk..', '.ksSkkSsk.', 'ksSsSSsSsk', 'ksSsSsSsSk', '.kSSSSSSk.', '..kkkkkk..'],
  },
  // A clump of dark moss in a bowl, with a purple sparkle.
  witch_moss: {
    palette: { k: K, g: 0x3f7a4a, G: 0x2a5a34, l: 0x6ab06a, p: 0xd08aff, b: 0x8a6a4a, B: 0x6a4a2a },
    rows: ['......p...', '.....ppp..', '...kk.pk..', '..klgkkgk.', '.kglgGglgk', 'kgGgglgGgk', 'kbbbbbbbbk', 'kbBbbbbBbk', '.kbbbbbbk.', '..kBBBBk..', '...kkkk...'],
  },
};

/** The art of an ingredient, or a plain jar for one without its own. */
export const ingredientArt = (id: string): Sprite => INGREDIENT_ART[id] ?? JAR;
