/**
 * A very small offline synthesiser.
 *
 * The studio generates its own music and cues rather than shipping third-party
 * tracks: everything here is original output of this file, so there is no
 * licensing question about the films it ends up in. It is deliberately simple —
 * oscillators, envelopes, a one-pole filter and a short reverb — because the
 * brief is "a bed that supports a 30 second product film", not "a DAW".
 */
import { writeFileSync } from "node:fs";

export const SAMPLE_RATE = 48_000;

export type Buffer2 = { left: Float64Array; right: Float64Array };

export const createBuffer = (seconds: number): Buffer2 => {
  const n = Math.ceil(seconds * SAMPLE_RATE);
  return { left: new Float64Array(n), right: new Float64Array(n) };
};

/** Equal-temperament frequency for a note name like "A3" or "Bb2". */
export const note = (name: string): number => {
  const m = /^([A-G])(b|#)?(-?\d)$/.exec(name);
  if (!m) throw new Error(`Bad note: ${name}`);
  const base: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  const semis = base[m[1]] + (m[2] === "#" ? 1 : m[2] === "b" ? -1 : 0);
  const octave = Number(m[3]);
  const midi = (octave + 1) * 12 + semis;
  return 440 * 2 ** ((midi - 69) / 12);
};

export type Wave = "sine" | "triangle" | "saw" | "softsaw" | "noise";

const oscillate = (wave: Wave, phase: number, seed: number): number => {
  switch (wave) {
    case "sine":
      return Math.sin(phase * Math.PI * 2);
    case "triangle":
      return 2 * Math.abs(2 * (phase - Math.floor(phase + 0.5))) - 1;
    case "saw":
      return 2 * (phase - Math.floor(phase + 0.5));
    case "softsaw": {
      // A saw with the high partials rolled off by summing a short harmonic series.
      let v = 0;
      for (let h = 1; h <= 7; h += 1) v += Math.sin(phase * Math.PI * 2 * h) / h;
      return v * 0.55;
    }
    case "noise": {
      // Deterministic value noise so renders are reproducible.
      let x = Math.imul(seed ^ 0x9e3779b9, 0x85ebca6b) >>> 0;
      x ^= x >>> 13;
      x = Math.imul(x, 0xc2b2ae35) >>> 0;
      return (x / 2147483648 - 1) * 0.6;
    }
  }
};

export type Envelope = {
  attack: number;
  decay: number;
  sustain: number;
  release: number;
};

const envelopeAt = (t: number, duration: number, env: Envelope): number => {
  if (t < 0) return 0;
  const { attack, decay, sustain, release } = env;
  if (t < attack) return t / attack;
  if (t < attack + decay) return 1 + (sustain - 1) * ((t - attack) / decay);
  if (t < duration) return sustain;
  const r = (t - duration) / release;
  return r >= 1 ? 0 : sustain * (1 - r);
};

export type VoiceOptions = {
  wave: Wave;
  freq: number;
  start: number;
  duration: number;
  gain: number;
  env: Envelope;
  /** Stereo position, -1 left to 1 right. */
  pan?: number;
  /** Detune in cents; spawns a second oscillator for width. */
  detune?: number;
  /** One-pole lowpass cutoff in Hz at note start. */
  cutoff?: number;
  /** Cutoff at note end; sweeps linearly. */
  cutoffEnd?: number;
  /** Vibrato depth in cents. */
  vibrato?: number;
  vibratoRate?: number;
};

/** Renders one voice into a buffer. */
export const voice = (buf: Buffer2, o: VoiceOptions): void => {
  const total = o.duration + o.env.release;
  const startSample = Math.floor(o.start * SAMPLE_RATE);
  const n = Math.ceil(total * SAMPLE_RATE);
  const pan = o.pan ?? 0;
  const gl = Math.cos(((pan + 1) * Math.PI) / 4);
  const gr = Math.sin(((pan + 1) * Math.PI) / 4);

  let phase = 0;
  let phase2 = 0;
  const detuneRatio = o.detune ? 2 ** (o.detune / 1200) : 1;
  let lp = 0;
  let lp2 = 0;

  for (let i = 0; i < n; i += 1) {
    const s = startSample + i;
    if (s < 0 || s >= buf.left.length) continue;
    const t = i / SAMPLE_RATE;
    const amp = envelopeAt(t, o.duration, o.env) * o.gain;
    if (amp <= 0) continue;

    const vib = o.vibrato
      ? 2 ** ((o.vibrato * Math.sin(t * Math.PI * 2 * (o.vibratoRate ?? 4.7))) / 1200)
      : 1;
    const f = o.freq * vib;
    phase += f / SAMPLE_RATE;
    phase2 += (f * detuneRatio) / SAMPLE_RATE;

    let v = oscillate(o.wave, phase, s);
    if (o.detune) v = (v + oscillate(o.wave, phase2, s + 7919)) * 0.6;

    if (o.cutoff) {
      const cut = o.cutoffEnd
        ? o.cutoff + (o.cutoffEnd - o.cutoff) * Math.min(1, t / total)
        : o.cutoff;
      const a = 1 - Math.exp((-2 * Math.PI * cut) / SAMPLE_RATE);
      lp += a * (v - lp);
      lp2 += a * (lp - lp2);
      v = lp2;
    }

    buf.left[s] += v * amp * gl;
    buf.right[s] += v * amp * gr;
  }
};

/**
 * A short Schroeder-style reverb: four combs into two allpasses. Enough to put
 * the pads in a room without smearing the pulse.
 */
export const reverb = (buf: Buffer2, mix = 0.26, decay = 0.72): void => {
  const combs = [1557, 1617, 1491, 1422, 1277, 1356];
  const allpass = [225, 556];
  const apply = (channel: Float64Array, offset: number) => {
    const out = new Float64Array(channel.length);
    for (const c of combs) {
      const d = c + offset;
      const buffer = new Float64Array(d);
      let idx = 0;
      for (let i = 0; i < channel.length; i += 1) {
        const y = buffer[idx];
        out[i] += y / combs.length;
        buffer[idx] = channel[i] + y * decay;
        idx = (idx + 1) % d;
      }
    }
    for (const a of allpass) {
      const d = a + offset;
      const buffer = new Float64Array(d);
      let idx = 0;
      for (let i = 0; i < out.length; i += 1) {
        const y = buffer[idx];
        const v = out[i] + y * -0.62;
        buffer[idx] = v;
        out[i] = y + v * 0.62;
        idx = (idx + 1) % d;
      }
    }
    for (let i = 0; i < channel.length; i += 1) {
      channel[i] = channel[i] * (1 - mix) + out[i] * mix;
    }
  };
  apply(buf.left, 0);
  apply(buf.right, 23);
};

/** Gentle saturation + peak normalisation to a target headroom. */
export const master = (buf: Buffer2, peak = 0.89): void => {
  let max = 0;
  for (let i = 0; i < buf.left.length; i += 1) {
    buf.left[i] = Math.tanh(buf.left[i] * 1.1);
    buf.right[i] = Math.tanh(buf.right[i] * 1.1);
    max = Math.max(max, Math.abs(buf.left[i]), Math.abs(buf.right[i]));
  }
  if (max === 0) return;
  const g = peak / max;
  for (let i = 0; i < buf.left.length; i += 1) {
    buf.left[i] *= g;
    buf.right[i] *= g;
  }
};

/** Fades the first and last moments so a track never clicks in or out. */
export const fadeEdges = (buf: Buffer2, inSec: number, outSec: number): void => {
  const nIn = Math.floor(inSec * SAMPLE_RATE);
  const nOut = Math.floor(outSec * SAMPLE_RATE);
  for (let i = 0; i < nIn; i += 1) {
    const g = i / nIn;
    buf.left[i] *= g;
    buf.right[i] *= g;
  }
  for (let i = 0; i < nOut; i += 1) {
    const s = buf.left.length - 1 - i;
    const g = i / nOut;
    buf.left[s] *= g;
    buf.right[s] *= g;
  }
};

/** Writes 16-bit stereo PCM WAV. */
export const writeWav = (path: string, buf: Buffer2): void => {
  const frames = buf.left.length;
  const dataBytes = frames * 2 * 2;
  const out = Buffer.alloc(44 + dataBytes);
  out.write("RIFF", 0);
  out.writeUInt32LE(36 + dataBytes, 4);
  out.write("WAVE", 8);
  out.write("fmt ", 12);
  out.writeUInt32LE(16, 16);
  out.writeUInt16LE(1, 20);
  out.writeUInt16LE(2, 22);
  out.writeUInt32LE(SAMPLE_RATE, 24);
  out.writeUInt32LE(SAMPLE_RATE * 4, 28);
  out.writeUInt16LE(4, 32);
  out.writeUInt16LE(16, 34);
  out.write("data", 36);
  for (let i = 0; i < frames; i += 1) {
    const l = Math.max(-1, Math.min(1, buf.left[i]));
    const r = Math.max(-1, Math.min(1, buf.right[i]));
    out.writeInt16LE(Math.round(l * 32767), 44 + i * 4);
    out.writeInt16LE(Math.round(r * 32767), 44 + i * 4 + 2);
  }
  writeFileSync(path, out);
};
