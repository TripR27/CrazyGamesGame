/** Placeholder look per ingredient: just a colour. The art pass replaces this with sprites. */
const COLORS: Readonly<Record<string, number>> = {
  swamp_slime: 0x7be05a,
  wild_honey: 0xf5c542,
  glowcap: 0x58d6d0,
  fire_pepper: 0xe2563b,
  moon_grape: 0x7a5fd1,
  troll_sweat: 0x9aa86a,
};

const FALLBACK = 0xcccccc;

export const ingredientColor = (id: string): number => COLORS[id] ?? FALLBACK;
