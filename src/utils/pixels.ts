/**
 * Pixel stability.
 *
 * Text that sits inside something which changes by a fraction of a pixel every
 * frame is re-rasterised every frame, and the glyph edges land on slightly
 * different subpixels each time. On a monitor it reads as softness; on a large
 * television it reads as the text visibly dancing.
 *
 * Two rules follow, and this file exists to make them easy to keep:
 *
 * 1. Animated offsets that carry text are rounded to whole pixels.
 * 2. Text never sits inside a transform that keeps changing after it has
 *    arrived. A shot is kept alive by moving the *image* instead, which is
 *    already pixels and has no glyphs to re-rasterise.
 */

/** Rounds an animated offset to a whole pixel. */
export const snap = (value: number): number => Math.round(value);

/**
 * Eases a value to its final state and then pins it exactly.
 *
 * `interpolate` with `extrapolateRight: "clamp"` already stops at the end
 * value, but floating point leaves it a hair off a round number — enough that
 * a `scale()` built from it never settles on an integer rasterisation. This
 * returns exactly `1` once the window has passed.
 */
export const settle = (frame: number, from: number, to: number): number => {
  if (frame >= to) return 1;
  if (frame <= from) return 0;
  return (frame - from) / (to - from);
};

/**
 * A transform string for an element that should arrive and then hold
 * perfectly still. After `settleFrame` it returns `none`, which takes the
 * element off the compositing path entirely.
 */
export const arriveTransform = (
  frame: number,
  settleFrame: number,
  build: (t: number) => string,
): string => (frame >= settleFrame ? "none" : build(settle(frame, 0, settleFrame)));
