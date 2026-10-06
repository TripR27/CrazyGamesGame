/** Placeholder looks per customer type: just a body colour. The art pass replaces this with sprites. */
const BODY_COLORS: Readonly<Record<string, number>> = {
  knight: 0x8d99a8,
  elf: 0x58b368,
  dwarf: 0xa5683a,
};

const FALLBACK_COLOR = 0xb36bd1;
export const SKIN_COLOR = 0xf2c9a0;

export const bodyColorFor = (typeId: string): number => BODY_COLORS[typeId] ?? FALLBACK_COLOR;
