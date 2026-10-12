import type { GameObjects, Scene, Types } from 'phaser';
import { ICONS, splitIcons } from '@/app/icon-art';
import { addStripTexture } from '@/app/textures-view';

type TextStyle = Types.GameObjects.Text.TextStyle;

/** Icons are 8 art pixels; drawn at the whole multiple closest to the font size. */
const ICON_PIXELS = 8;
const ICON_GAP = 2;

/** The texture of an icon (made the first time it is asked for), keyed by its emoji. */
export function iconTexture(scene: Scene, icon: string): string {
  const key = `icon_${icon.codePointAt(0)?.toString(16) ?? 'none'}`;
  const art = ICONS[icon];
  if (art !== undefined) addStripTexture(scene, key, [art]);
  return key;
}

export interface IconText {
  /** Move, fade, show or tween this. */
  container: GameObjects.Container;
  /** The size of what is shown, in design pixels. */
  width: number;
  height: number;
  setText(text: string): void;
  setStyle(style: TextStyle): void;
}

/**
 * Words and pixel icons side by side (the emoji in a text become icons), centred on the container's x; `originY` 0.5
 * puts the middle on its y, 1 the bottom. A text without icons is one Text, which may wrap. Its pieces are reused.
 */
export function createIconText(scene: Scene, style: TextStyle, originY = 0.5): IconText {
  const container = scene.add.container(0, 0);
  const texts: GameObjects.Text[] = [];
  const icons: GameObjects.Image[] = [];
  let current = style;
  const result: IconText = {
    container,
    width: 0,
    height: 0,
    setText(value) {
      const size = Number.parseInt(String(current.fontSize ?? '16'), 10);
      const scale = Math.max(1, Math.round(size / ICON_PIXELS));
      const iconSize = ICON_PIXELS * scale;
      let x = 0;
      let height = iconSize;
      let nt = 0;
      let ni = 0;
      for (const part of splitIcons(value)) {
        if (part.icon !== undefined) {
          const image = icons[ni] ?? scene.add.image(0, 0, '__DEFAULT').setOrigin(0, 0.5);
          if (icons[ni] === undefined) container.add((icons[ni] = image));
          image.setTexture(iconTexture(scene, part.icon)).setScale(scale).setVisible(true).setX(x + 1);
          x += iconSize + ICON_GAP;
          ni += 1;
          continue;
        }
        const text = texts[nt] ?? scene.add.text(0, 0, '', current).setOrigin(0, 0.5);
        if (texts[nt] === undefined) container.add((texts[nt] = text));
        text.setText(part.text).setVisible(true).setX(x);
        x += text.width;
        height = Math.max(height, text.height);
        nt += 1;
      }
      for (let i = nt; i < texts.length; i++) texts[i]?.setVisible(false);
      for (let i = ni; i < icons.length; i++) icons[i]?.setVisible(false);
      const dy = (0.5 - originY) * height;
      for (const child of [...texts.slice(0, nt), ...icons.slice(0, ni)]) child.setPosition(child.x - x / 2, dy);
      result.width = x;
      result.height = height;
    },
    setStyle(next) {
      current = { ...current, ...next };
      for (const text of texts) text.setStyle(current);
    },
  };
  return result;
}
