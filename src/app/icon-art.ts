import { mirrored, type Sprite, withPixels } from '@/shared/pixels';

/**
 * Pixel-art icons (8×8 art pixels) in place of the emoji in the game's texts. The texts keep the emoji as the key (so
 * i18n stays plain text); the DOM and the canvas draw the icon instead. A new icon is one entry here.
 */
const K = 0x1a1a22;
const INK = 0x3b2410;
const GOLD = { y: 0xf5c542, Y: 0xfff2a0, G: 0xc99a2a };

const HEART: Sprite = {
  palette: { k: K, r: 0xe2364b, w: 0xffb0b8 },
  rows: ['.kk..kk.', 'kwrkkrrk', 'krrrrrrk', 'krrrrrrk', '.krrrrk.', '..krrk..', '...kk...', '........'],
};

const CROSS = ['kk....kk', '.kk..kk.', '..kkkk..', '...kk...', '..kkkk..', '.kk..kk.', 'kk....kk', '........'];
const SPEAKER = ['...k....', '..kk....', 'kkkk....', 'kkkk....', 'kkkk....', 'kkkk....', '..kk....', '...k....'];

const sprite = (palette: Readonly<Record<string, number>>, rows: readonly string[]): Sprite => ({ palette, rows });

export const ICONS: Readonly<Record<string, Sprite>> = {
  '♥': HEART,
  '💖': withPixels({ ...HEART, palette: { k: K, r: 0xff6ac0, w: 0xffd0ec, s: 0xffffff } }, [[7, 0, 's'], [6, 1, 's'], [7, 2, 's']]),
  '⚡': sprite({ k: K, y: GOLD.y }, ['....kkk.', '...kyyk.', '..kyyk..', '.kyyyyk.', '..kyyk..', '.kyyk...', 'kyk.....', 'kk......']),
  '🍀': mirrored({ k: K, g: 0x4fae4f, b: 0x2f6a2f }, ['.kk.', 'kggk', 'kggg', '.kgg', 'kggg', 'kggk', '.kkb', '...b']),
  '💪': sprite({ k: K, s: 0xf2c9a0 }, ['..kkk...', '.ksssk..', '.kssk...', '.kssk.kk', '.ksskksk', '.kssssk.', '.kssssk.', '..kkkk..']),
  '👑': sprite({ k: K, ...GOLD, j: 0xd23a3a }, ['Y..YY..Y', 'yy.yy.yy', 'yyyyyyyy', 'yjyyyyjy', 'yyyjjyyy', 'GGGGGGGG', 'kkkkkkkk', '........']),
  '🎒': sprite({ k: K, b: 0x9a6a3a, B: 0x7a4a24, y: GOLD.y }, ['..kkkk..', '.kbbbbk.', 'kbbbbbbk', 'kBkkkkBk', 'kbbyybbk', 'kbbbbbbk', 'kbbbbbbk', '.kkkkkk.']),
  '🌼': sprite({ k: K, ...GOLD, g: 0x4f8148 }, ['...kk...', '..kggk..', '.kyyyyk.', 'kyGyyGyk', 'kyyyyyyk', '.kyGyGk.', '..kyyk..', '...kk...']),
  '🏆': sprite({ k: K, ...GOLD }, ['.kkkkkk.', 'kyYyyyyk', 'kyYyyyyk', '.kyyyyk.', '..kyyk..', '...yy...', '..kGGk..', '.kkkkkk.']),
  '🔒': sprite({ k: K, a: 0xb8c0cc }, ['..kkkk..', '.k....k.', '.k....k.', 'kkkkkkkk', 'kaaaaaak', 'kaakkaak', 'kaaaaaak', 'kkkkkkkk']),
  '🎁': sprite({ k: K, r: 0xd23a3a, y: GOLD.y }, ['.yy..yy.', '..yyyy..', 'kkkyykkk', 'krryyrrk', 'kkkyykkk', 'krryyrrk', 'krryyrrk', 'kkkkkkkk']),
  '🗺': sprite({ k: K, p: 0xf2dfb0, j: 0xd23a3a, b: 0x8a5a2a }, ['kkkkkkkk', 'kpppjpjk', 'kppppjpk', 'kpbpjpjk', 'kpbppppk', 'kppbbppk', 'kpppppbk', 'kkkkkkkk']),
  '🤕': sprite({ k: K, w: 0xf2f2e6, r: 0xe2364b }, ['.kkkkkk.', 'kwwwwwwk', 'kwwrrwwk', 'kwrrrrwk', 'kwrrrrwk', 'kwwrrwwk', 'kwwwwwwk', '.kkkkkk.']),
  '🔁': sprite({ g: 0x3f9a4a }, ['..gggg..', '.g....g.', 'g....ggg', 'g.....g.', '.g.....g', 'ggg....g', '.g....g.', '..gggg..']),
  '⚔': sprite({ k: K, a: 0xd8dce4, y: GOLD.y, b: 0x6b4423 }, ['a......a', '.a....a.', '..a..a..', '...aa...', '...aa...', 'kyk..kyk', '.b....b.', 'b......b']),
  '🛡': mirrored({ k: K, b: 0x3b5bb5, y: GOLD.y }, ['kkkk', 'kbbb', 'kbby', 'kbyy', 'kbby', '.kbb', '..kb', '...k']),
  '⛑': sprite({ k: K, a: 0xb8c0cc, A: 0xe8eef4 }, ['..kkkk..', '.kaaaak.', 'kaAaaaak', 'kaAaaaak', 'kkkkkkkk', 'kak..kak', 'kak..kak', '.k....k.']),
  '📿': sprite({ k: K, y: GOLD.y, j: 0x58d6d0, J: 0xe8fffe }, ['y......y', '.y....y.', '..y..y..', '..kyyk..', '.kjjjjk.', '.kjJjjk.', '..kjjk..', '...kk...']),
  '☰': sprite({ k: INK }, ['........', 'kkkkkkkk', '........', '........', 'kkkkkkkk', '........', '........', 'kkkkkkkk']),
  '📺': sprite({ k: K, s: 0x5ad1ff, S: 0xe8fffe }, ['..k..k..', '...kk...', 'kkkkkkkk', 'ksSssssk', 'kSsssssk', 'kssssssk', 'kkkkkkkk', '.k....k.']),
  '✕': sprite({ k: INK }, CROSS),
  '✖': sprite({ k: 0xe2364b }, CROSS),
  '⚙': sprite({ k: INK }, ['...kk...', '.kkkkkk.', '.kk..kk.', 'kkk..kkk', 'kkk..kkk', '.kk..kk.', '.kkkkkk.', '...kk...']),
  '🔊': withPixels(sprite({ k: INK }, SPEAKER), [[6, 1, 'k'], [7, 2, 'k'], [5, 3, 'k'], [7, 3, 'k'], [5, 4, 'k'], [7, 4, 'k'], [7, 5, 'k'], [6, 6, 'k']]),
  '🔇': withPixels({ palette: { k: INK, r: 0xe2364b }, rows: SPEAKER }, [[5, 2, 'r'], [7, 2, 'r'], [6, 3, 'r'], [5, 4, 'r'], [7, 4, 'r']]),
  '💥': sprite({ o: 0xe8641a, y: GOLD.y, W: 0xfff2cc }, ['o...o..o', '.o.oyo..', '..yyyyo.', 'ooyWWyoo', '..yWWy..', '.oyyyyo.', '.o..o.o.', 'o...o..o']),
  '○': sprite({ k: 0x8a8a96 }, ['..kkkk..', '.k....k.', 'k......k', 'k......k', 'k......k', 'k......k', '.k....k.', '..kkkk..']),
  '▼': sprite({ k: 0x1a3a1a, g: 0x3fbf3f }, ['........', '........', 'kkkkkkkk', 'kggggggk', '.kggggk.', '..kggk..', '...kk...', '........']),
};

/** A piece of text: plain words, or an icon (by its emoji). */
export type TextPart = { text: string; icon?: undefined } | { icon: string; text?: undefined };

/** Splits a text into words and icons (an emoji with an icon becomes its own part; the emoji variation mark is dropped). */
export function splitIcons(text: string): TextPart[] {
  const parts: TextPart[] = [];
  let words = '';
  for (const char of Array.from(text)) {
    if (char === '️') continue;
    if (ICONS[char] === undefined) {
      words += char;
      continue;
    }
    if (words !== '') parts.push({ text: words });
    words = '';
    parts.push({ icon: char });
  }
  if (words !== '') parts.push({ text: words });
  return parts;
}

/** The icon emoji in a text (to know quickly whether a text needs icons at all). */
export const hasIcons = (text: string): boolean => Array.from(text).some((char) => ICONS[char] !== undefined);
