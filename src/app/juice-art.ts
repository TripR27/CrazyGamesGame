import type { Sprite } from '@/shared/pixels';

/** The little pixel sprites of the effects (see shared/pixels.ts): a spinning coin, a sparkle and a puff of steam. */
const COIN_PALETTE = { k: 0x8a5a10, y: 0xf5c542, Y: 0xfff2a0, o: 0xc99a2a };

/** A coin turning round: face, narrower, edge, narrower. */
export const COIN_FRAMES: readonly Sprite[] = [
  ['.kkkk.', 'kYyyyk', 'kYyyyk', 'kyyyok', 'kyyyok', '.kkkk.'],
  ['..kk..', '.kYyk.', '.kYyk.', '.kyok.', '.kyok.', '..kk..'],
  ['..kk..', '..kk..', '..Yk..', '..yk..', '..kk..', '..kk..'],
  ['..kk..', '.kYyk.', '.kYyk.', '.kyok.', '.kyok.', '..kk..'],
].map((rows) => ({ palette: COIN_PALETTE, rows }));

const SPARKLE_PALETTE = { w: 0xfff2cc, y: 0xf5c542, Y: 0xffffff };

/** A big and a small twinkle. */
export const SPARKLE_FRAMES: readonly Sprite[] = [
  ['..w..', '..y..', 'wyYyw', '..y..', '..w..'],
  ['.....', '..y..', '.yYy.', '..y..', '.....'],
].map((rows) => ({ palette: SPARKLE_PALETTE, rows }));

/** A small cloud: steam from the cauldron, or (tinted red) a customer fuming. */
export const PUFF: Sprite = {
  palette: { w: 0xd8d8e0, W: 0xffffff },
  rows: ['.wwww.', 'wwWwww', 'wWwwww', 'wwwwWw', '.wwww.'],
};
