/**
 * A sprite is drawn as text: one string per pixel row, one character per pixel.
 * '.' is transparent; every other character must exist in the sprite's palette.
 */
export function parseSprite(name, { palette, rows }) {
  const width = rows[0].length;
  const pixels = [];
  rows.forEach((row, y) => {
    if (row.length !== width) {
      throw new Error(`${name}: row ${y} is ${row.length} wide, expected ${width}`);
    }
    for (const char of row) {
      if (char === '.') pixels.push(null);
      else if (palette[char] === undefined) throw new Error(`${name}: row ${y} uses unknown "${char}"`);
      else pixels.push(palette[char]);
    }
  });
  return { name, width, height: rows.length, pixels };
}

export function flipHorizontal(sprite) {
  const pixels = [];
  for (let y = 0; y < sprite.height; y++) {
    const row = sprite.pixels.slice(y * sprite.width, (y + 1) * sprite.width);
    pixels.push(...row.reverse());
  }
  return { ...sprite, pixels };
}
