/**
 * Headline sizing.
 *
 * A film that renders at three aspect ratios cannot hard-code a font size: the
 * same sentence that sits on one line at 1920 wide will wrap at 1080 and break
 * the masked reveal. Rather than guessing per format, every headline is sized
 * from its own longest line so it always fits the measure.
 *
 * `advance` is the mean glyph advance of Inter at display weights, measured as
 * a fraction of the em. It is a heuristic, not a text metric — but it is a
 * conservative one, and the result is clamped to the format's own scale.
 */
const AVERAGE_ADVANCE = 0.505;

export const fitSize = (
  lines: string[],
  maxWidth: number,
  maxSize: number,
  advance = AVERAGE_ADVANCE,
): number => {
  const longest = lines.reduce((n, l) => Math.max(n, l.length), 1);
  const fitted = maxWidth / (longest * advance);
  return Math.max(maxSize * 0.42, Math.min(maxSize, fitted));
};
