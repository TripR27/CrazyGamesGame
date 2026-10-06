export interface Fit {
  scale: number;
  left: number;
  top: number;
}

/** Same rule as Phaser's Scale.FIT with centring: largest uniform scale that fits, centred. */
export function computeFit(viewW: number, viewH: number, designW: number, designH: number): Fit {
  const scale = Math.min(viewW / designW, viewH / designH);
  return {
    scale,
    left: (viewW - designW * scale) / 2,
    top: (viewH - designH * scale) / 2,
  };
}
