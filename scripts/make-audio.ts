/**
 * Generates the studio's original score and UI cues.
 *
 * The bed is written against the launch film's edit: its swells peak on the
 * cut points so the music lifts with the picture instead of running underneath
 * it. Re-run after changing scene durations.
 */
import { mkdirSync } from "node:fs";
import path from "node:path";
import {
  createBuffer,
  fadeEdges,
  master,
  note,
  reverb,
  voice,
  writeWav,
  type Buffer2,
  type Envelope,
} from "./synth";

const OUT = path.resolve(process.cwd(), "public", "assets", "audio");

const PAD: Envelope = { attack: 1.1, decay: 1.6, sustain: 0.72, release: 2.4 };
const PLUCK: Envelope = { attack: 0.004, decay: 0.42, sustain: 0.12, release: 0.9 };
const SUB: Envelope = { attack: 0.35, decay: 1.2, sustain: 0.8, release: 1.6 };
const PULSE: Envelope = { attack: 0.002, decay: 0.16, sustain: 0, release: 0.12 };

/**
 * Each edition has its own bed, cut to its own scene boundaries.
 *
 * The cut points are kept here rather than imported so this script has no
 * dependency on the Remotion bundle. They must match the timeline that
 * `npm run pds -- timeline <film>` prints; change a scene duration and change
 * the matching list here.
 */
type Bed = { file: string; cuts: number[]; length: number };

const BEDS: Bed[] = [
  // LaunchFilm / LaunchFilmStandard — 30.000s
  { file: "music-launch.wav", cuts: [4.5, 8.0, 15.5, 19.4, 25.3], length: 31.5 },
  // LaunchFilmVertical — 25.000s
  { file: "music-launch-vertical.wav", cuts: [3.2, 6.2, 12.2, 15.6, 20.6], length: 26.5 },
  // PartnerFilm — 60.000s
  {
    file: "music-partner.wav",
    cuts: [5.0, 10.5, 14.0, 18.5, 25.5, 31.6, 36.1, 39.7, 49.0, 55.0],
    length: 61.5,
  },
];

/**
 * D dorian. Calm, open, not melancholy — the product is useful, not sad.
 * One chord per section; a section runs from one cut to the next, so the
 * harmony turns over exactly when the picture does. The progression cycles for
 * a film with more cuts than it has chords.
 */
const PROGRESSION: string[][] = [
  ["D2", "D3", "A3"],
  ["D2", "F3", "A3", "E4"],
  ["Bb1", "D3", "F3", "A3"],
  ["F2", "A2", "C4", "G3"],
  ["C2", "G3", "Bb3", "D4"],
  ["D2", "F3", "A3", "D4"],
];

/**
 * Section weight over the length of a piece: sparse at the open, full through
 * the middle, easing back for the close. Expressed as a curve rather than a
 * table so a film of any number of sections is shaped the same way.
 */
const weightAt = (index: number, total: number): number => {
  if (total <= 1) return 0.9;
  const t = index / (total - 1);
  if (t < 0.35) return 0.55 + (t / 0.35) * 0.35;
  if (t > 0.85) return 1.0 - ((t - 0.85) / 0.15) * 0.1;
  return 0.9 + Math.sin(((t - 0.35) / 0.5) * Math.PI) * 0.1;
};

const sectionsFor = (cuts: number[]) => {
  const total = cuts.length + 1;
  return Array.from({ length: total }, (_, i) => ({
    chord: PROGRESSION[i % PROGRESSION.length],
    weight: weightAt(i, total),
    at: i === 0 ? 0 : cuts[i - 1],
  }));
};

const buildMusic = (bed: Bed): Buffer2 => {
  const LENGTH = bed.length;
  const CUTS = bed.cuts;
  const SECTIONS = sectionsFor(CUTS);
  const buf = createBuffer(LENGTH);
  const bpm = 96;
  const beat = 60 / bpm;

  // --- Pads: one sustained chord per section, overlapping at the seams ------
  SECTIONS.forEach((section, i) => {
    const next = SECTIONS[i + 1];
    const end = next ? next.at + 1.1 : LENGTH - 0.4;
    const dur = end - section.at;
    section.chord.forEach((n, j) => {
      const f = note(n);
      voice(buf, {
        wave: "softsaw",
        freq: f,
        start: section.at,
        duration: Math.max(0.6, dur - PAD.release),
        gain: 0.1 * section.weight * (j === 0 ? 1.25 : 0.8),
        env: PAD,
        pan: j === 0 ? 0 : (j % 2 === 0 ? -0.45 : 0.45),
        detune: j === 0 ? 0 : 7,
        cutoff: 420 + section.weight * 900,
        cutoffEnd: 700 + section.weight * 1500,
      });
    });
  });

  // --- Sub: the root, an octave down, holding the whole piece together -----
  SECTIONS.forEach((section, i) => {
    const next = SECTIONS[i + 1];
    const end = next ? next.at : LENGTH - 1.2;
    voice(buf, {
      wave: "sine",
      freq: note(section.chord[0]) / 2,
      start: section.at,
      duration: Math.max(0.8, end - section.at - 0.2),
      gain: 0.3 * section.weight,
      env: SUB,
      cutoff: 180,
    });
  });

  // --- Arpeggio: enters at the first cut, eighths, sparse ----------------
  const last = CUTS[CUTS.length - 1];
  const arpStart = CUTS[0];
  const arpEnd = last + 2.2;
  for (let t = arpStart, k = 0; t < arpEnd; t += beat / 2, k += 1) {
    const section = [...SECTIONS].reverse().find((s) => s.at <= t) ?? SECTIONS[0];
    const tones = section.chord.slice(1);
    if (tones.length === 0) continue;
    // A rising-then-falling figure rather than a loop, so it never nags.
    const shape = [0, 1, 2, 1, 2, 0, 1, 2];
    const n = tones[shape[k % shape.length] % tones.length];
    const octave = k % 8 >= 5 ? 2 : 1;
    const ramp = Math.min(1, (t - arpStart) / 3.5);
    const tail = t > last ? Math.max(0, 1 - (t - last) / 2.2) : 1;
    voice(buf, {
      wave: "triangle",
      freq: note(n) * octave,
      start: t,
      duration: 0.16,
      gain: 0.052 * ramp * tail * section.weight,
      env: PLUCK,
      pan: k % 2 === 0 ? -0.3 : 0.3,
      cutoff: 2400,
      cutoffEnd: 900,
    });
  }

  // --- Pulse: half-time, enters at the walkthrough, out before the close ---
  const pulseStart = CUTS[1];
  const pulseEnd = last;
  for (let t = pulseStart; t < pulseEnd; t += beat) {
    const ramp = Math.min(1, (t - pulseStart) / 2.4);
    const fall = t > pulseEnd - 2.4 ? Math.max(0, (pulseEnd - t) / 2.4) : 1;
    // Low thump.
    voice(buf, {
      wave: "sine",
      freq: 58,
      start: t,
      duration: 0.1,
      gain: 0.3 * ramp * fall,
      env: { attack: 0.002, decay: 0.12, sustain: 0, release: 0.1 },
      cutoff: 160,
    });
    // Air on the offbeat.
    voice(buf, {
      wave: "noise",
      freq: 1,
      start: t + beat / 2,
      duration: 0.03,
      gain: 0.022 * ramp * fall,
      env: PULSE,
      pan: 0.2,
      cutoff: 9000,
      cutoffEnd: 4000,
    });
  }

  // --- Swells: a breath that peaks on every cut ----------------------------
  for (const cut of CUTS) {
    voice(buf, {
      wave: "noise",
      freq: 1,
      start: cut - 1.1,
      duration: 1.0,
      gain: 0.03,
      env: { attack: 0.95, decay: 0.05, sustain: 0.9, release: 0.5 },
      cutoff: 300,
      cutoffEnd: 3200,
    });
  }

  reverb(buf, 0.3, 0.74);
  master(buf, 0.82);
  fadeEdges(buf, 0.8, 2.2);
  return buf;
};

/** A short noise sweep used across hard cuts. */
const buildWhoosh = (): Buffer2 => {
  const buf = createBuffer(0.9);
  voice(buf, {
    wave: "noise",
    freq: 1,
    start: 0,
    duration: 0.36,
    gain: 0.5,
    env: { attack: 0.18, decay: 0.1, sustain: 0.5, release: 0.34 },
    cutoff: 400,
    cutoffEnd: 7000,
    pan: -0.2,
  });
  voice(buf, {
    wave: "noise",
    freq: 1,
    start: 0.1,
    duration: 0.3,
    gain: 0.3,
    env: { attack: 0.14, decay: 0.08, sustain: 0.4, release: 0.3 },
    cutoff: 6000,
    cutoffEnd: 600,
    pan: 0.25,
  });
  reverb(buf, 0.22, 0.6);
  master(buf, 0.6);
  fadeEdges(buf, 0.01, 0.2);
  return buf;
};

/** A soft wooden tick for interface events. */
const buildTick = (): Buffer2 => {
  const buf = createBuffer(0.4);
  voice(buf, {
    wave: "triangle",
    freq: note("A5"),
    start: 0,
    duration: 0.03,
    gain: 0.3,
    env: { attack: 0.001, decay: 0.07, sustain: 0, release: 0.12 },
    cutoff: 5200,
    cutoffEnd: 1800,
  });
  voice(buf, {
    wave: "sine",
    freq: note("E6"),
    start: 0.004,
    duration: 0.02,
    gain: 0.13,
    env: { attack: 0.001, decay: 0.05, sustain: 0, release: 0.08 },
  });
  reverb(buf, 0.16, 0.5);
  master(buf, 0.5);
  fadeEdges(buf, 0.002, 0.08);
  return buf;
};

/** A warm two-note confirm for data landing and the logo. */
const buildConfirm = (): Buffer2 => {
  const buf = createBuffer(1.6);
  [
    ["D5", 0],
    ["A5", 0.11],
  ].forEach(([n, at]) => {
    voice(buf, {
      wave: "sine",
      freq: note(n as string),
      start: at as number,
      duration: 0.16,
      gain: 0.26,
      env: { attack: 0.004, decay: 0.3, sustain: 0.1, release: 0.7 },
    });
    voice(buf, {
      wave: "triangle",
      freq: note(n as string) * 2,
      start: at as number,
      duration: 0.1,
      gain: 0.07,
      env: { attack: 0.004, decay: 0.2, sustain: 0.05, release: 0.5 },
      cutoff: 4000,
    });
  });
  reverb(buf, 0.3, 0.7);
  master(buf, 0.55);
  fadeEdges(buf, 0.003, 0.3);
  return buf;
};

/** A low riser for the brand reveal. */
const buildRiser = (): Buffer2 => {
  const buf = createBuffer(1.8);
  voice(buf, {
    wave: "softsaw",
    freq: note("D2"),
    start: 0,
    duration: 1.1,
    gain: 0.22,
    env: { attack: 1.0, decay: 0.1, sustain: 0.8, release: 0.6 },
    cutoff: 180,
    cutoffEnd: 2600,
    detune: 11,
  });
  voice(buf, {
    wave: "noise",
    freq: 1,
    start: 0.2,
    duration: 0.9,
    gain: 0.06,
    env: { attack: 0.85, decay: 0.05, sustain: 0.8, release: 0.4 },
    cutoff: 500,
    cutoffEnd: 8000,
  });
  reverb(buf, 0.26, 0.68);
  master(buf, 0.62);
  fadeEdges(buf, 0.02, 0.3);
  return buf;
};

const main = () => {
  mkdirSync(OUT, { recursive: true });
  const jobs: [string, Buffer2][] = [
    ...BEDS.map((bed) => [bed.file, buildMusic(bed)] as [string, Buffer2]),
    ["cue-whoosh.wav", buildWhoosh()],
    ["cue-tick.wav", buildTick()],
    ["cue-confirm.wav", buildConfirm()],
    ["cue-riser.wav", buildRiser()],
  ];
  for (const [name, buf] of jobs) {
    const file = path.join(OUT, name);
    writeWav(file, buf);
    process.stdout.write(`  ✓ ${name} (${(buf.left.length / 48000).toFixed(2)}s)\n`);
  }
};

main();
