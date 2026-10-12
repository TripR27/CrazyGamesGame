#!/usr/bin/env python3
"""
Brewmaster's Tavern - the three CrazyGames covers, made from the tavern picture of `npm run pixel:preview`.

    npm run pixel:preview                  # writes art/pixel/thumbnail-landscape.png (the whole tavern, 6x)
    python scripts/covers/make_covers.py   # writes art/covers/cover-landscape.png, cover-square.png, cover-portrait.png

CrazyGames (docs.crazygames.com/requirements/game-covers, checked 2026-10-12): landscape 1920x1080, portrait 800x1200,
square 800x800; the title is the only text, no borders, no icons, nothing blurry. Square and portrait show the column
with the cauldron, with the dark roof drawn higher to make room for the title. The title is set in the game's own font
(Pixelify Sans, SIL OFL) on the art's pixel grid without smoothing and scaled up like the art, so it stays sharp; from
17 px the font draws a straight apostrophe. Needs Pillow.
"""
from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[2]
FONT = ROOT / 'public' / 'fonts' / 'PixelifySans.ttf'
SOURCE = ROOT / 'art' / 'pixel' / 'thumbnail-landscape.png'
SOURCE_SCALE = 6
TARGET = ROOT / 'art' / 'covers'

GOLD = (245, 197, 66)
OUTLINE = (42, 22, 8)
SHADOW = (20, 10, 4)

# Per cover, in art pixels: which columns of the tavern, how many rows of roof go on top, the title lines, the font size
# and the scale up to the cover size. The title sits in the middle of the roof.
COVERS = {
    'landscape': {'x': 0, 'width': 320, 'roof': 0, 'lines': ["Brewmaster's Tavern"], 'size': 18, 'scale': 6},
    'square': {'x': 110, 'width': 160, 'roof': 20, 'lines': ["Brewmaster's", 'Tavern'], 'size': 17, 'scale': 5, 'rows': 140},
    'portrait': {'x': 110, 'width': 160, 'roof': 60, 'lines': ["Brewmaster's", 'Tavern'], 'size': 17, 'scale': 5, 'rows': 180},
}
# The tavern picture starts with this many rows of plain dark roof.
ROOF_ROWS = 20


def title_height(draw: ImageDraw.ImageDraw, lines: list[str], font: ImageFont.FreeTypeFont) -> int:
    boxes = [draw.textbbox((0, 0), line, font=font, stroke_width=1) for line in lines]
    return sum(lower - upper + 1 for _, upper, _, lower in boxes)


def draw_title(art: Image.Image, lines: list[str], size: int, band: int) -> None:
    """Gold letters with a one-pixel dark outline and a shadow one pixel lower, centred in the roof band."""
    draw = ImageDraw.Draw(art)
    draw.fontmode = '1'
    font = ImageFont.truetype(str(FONT), size)
    y = max(1, (band - title_height(draw, lines, font)) // 2)
    for line in lines:
        left, upper, right, lower = draw.textbbox((0, 0), line, font=font, stroke_width=1)
        x = (art.width - (right - left)) // 2 - left
        draw.text((x, y - upper + 1), line, font=font, fill=SHADOW, stroke_width=1, stroke_fill=SHADOW)
        draw.text((x, y - upper), line, font=font, fill=GOLD, stroke_width=1, stroke_fill=OUTLINE)
        y += lower - upper + 1


def compose(tavern: Image.Image, spec: dict) -> Image.Image:
    rows = spec.get('rows', tavern.height)
    scene = tavern.crop((spec['x'], 0, spec['x'] + spec['width'], rows))
    art = Image.new('RGB', (spec['width'], spec['roof'] + rows), tavern.getpixel((0, 0)))
    art.paste(scene, (0, spec['roof']))
    draw_title(art, spec['lines'], spec['size'], spec['roof'] + ROOF_ROWS)
    return art.resize((art.width * spec['scale'], art.height * spec['scale']), Image.NEAREST)


def main() -> None:
    TARGET.mkdir(parents=True, exist_ok=True)
    raw = Image.open(SOURCE).convert('RGB')
    tavern = raw.resize((raw.width // SOURCE_SCALE, raw.height // SOURCE_SCALE), Image.NEAREST)
    for name, spec in COVERS.items():
        cover = compose(tavern, spec)
        cover.save(TARGET / f'cover-{name}.png', optimize=True)
        print(f'cover-{name}.png {cover.width}x{cover.height}')


if __name__ == '__main__':
    main()
