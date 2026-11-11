/**
 * Seeded pseudo-randomness.
 *
 * Nothing in a composition may call Math.random(): two renders of the same
 * frame must produce the same pixels. Anything that wants a "random" value
 * derives it from a stable string seed instead.
 */
const hash = (seed: string): number => {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
};

/** Deterministic value in [0, 1). */
export const rand = (seed: string): number => {
  let x = hash(seed) || 1;
  x ^= x << 13;
  x >>>= 0;
  x ^= x >> 17;
  x ^= x << 5;
  x >>>= 0;
  return x / 4294967296;
};

/** Deterministic value in [min, max). */
export const randRange = (seed: string, min: number, max: number): number =>
  min + rand(seed) * (max - min);

/** Deterministic array of n values in [0, 1). */
export const randSeries = (seed: string, n: number): number[] =>
  Array.from({ length: n }, (_, i) => rand(`${seed}:${i}`));
