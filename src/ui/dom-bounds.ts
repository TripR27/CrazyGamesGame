import type { Bounds } from '@/shared/targets';

/** Bounds of a DOM element in design pixels (undoing the overlay's scale), for the target registry. */
export function domBounds(el: HTMLElement, root: HTMLElement): Bounds {
  const box = el.getBoundingClientRect();
  const rootBox = root.getBoundingClientRect();
  const scale = rootBox.width / root.offsetWidth || 1;
  return {
    x: (box.left - rootBox.left) / scale,
    y: (box.top - rootBox.top) / scale,
    w: box.width / scale,
    h: box.height / scale,
  };
}
