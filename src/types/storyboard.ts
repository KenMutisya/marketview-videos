import { z } from "zod";
import { zColor } from "@remotion/zod-types";
import { formatIdSchema } from "./format";
import { motionPersonalitySchema } from "./brand";

/**
 * A storyboard is data. Scenes are a closed set of *kinds*, each backed by a
 * component; a new film is authored by writing scenes, not by writing React.
 */

export const transitionSchema = z.object({
  kind: z.enum(["cut", "fade", "dip", "push", "maskWipe", "zoomThrough"]),
  seconds: z.number().min(0).max(2).default(0.4),
  /** Dip colour for the "dip" transition. */
  through: zColor().optional(),
  direction: z.enum(["left", "right", "up", "down"]).optional(),
});
export type TransitionSpec = z.infer<typeof transitionSchema>;

const framingSchema = z.object({
  region: z.string().optional(),
  pad: z.number().optional(),
});

const cursorStopSchema = z.object({
  /** Seconds into the scene at which the cursor arrives. */
  at: z.number(),
  /** Position as a fraction of the UI frame. */
  x: z.number(),
  y: z.number(),
  click: z.boolean().optional(),
});

const calloutSchema = z.object({
  /** Seconds into the scene. */
  at: z.number(),
  /** Seconds at which it leaves. */
  until: z.number().optional(),
  text: z.string(),
  /** Anchor as a fraction of the frame. */
  x: z.number(),
  y: z.number(),
  tone: z.enum(["neutral", "good", "warn", "bad"]).default("neutral"),
});

/**
 * One spoken line.
 *
 * The same line is both the narration and the burned-in caption, which is the
 * point: a caption that is a paraphrase of the voiceover is worse than no
 * caption, because the half of the audience watching on mute reads something
 * the other half never hears.
 *
 * `at` is seconds into the **scene**. Omit it and the line follows the previous
 * one, spaced by the measured length of the synthesised audio rather than by a
 * guess — see `scripts/make-narration.ts`.
 */
export const voiceLineSchema = z.object({
  text: z.string().min(1),
  at: z.number().min(0).optional(),
});
export type VoiceLine = z.infer<typeof voiceLineSchema>;

const base = {
  id: z.string(),
  /** Why this scene exists. Read by the QA report; keep it honest. */
  purpose: z.string(),
  seconds: z.number().min(0.4),
  /**
   * What is said over this scene, and what is burned in as captions.
   *
   * A scene with no voiceover plays to music, which is what the opening
   * "POV:" cards of the campaign films do deliberately.
   */
  voiceover: z.array(voiceLineSchema).default([]),
  transitionOut: transitionSchema.optional(),
};

export const sceneSchema = z.discriminatedUnion("kind", [
  /** Kinetic statement on a brand field. Carries the hook and the thesis. */
  z.object({
    ...base,
    kind: z.literal("statement"),
    lines: z.array(z.string()).min(1),
    /** A second, harder-hitting block that lands after the first. */
    sting: z.array(z.string()).optional(),
    eyebrow: z.string().optional(),
    emphasise: z.array(z.string()).default([]),
    field: z.enum(["deep", "light", "accent"]).default("deep"),
    network: z.boolean().default(false),
    /** Backdrop capture shown behind the type, heavily treated. */
    backdrop: z.string().optional(),
    align: z.enum(["left", "center"]).default("left"),
  }),

  /** Brand lands, then the product rises into frame. */
  z.object({
    ...base,
    kind: z.literal("brandReveal"),
    tagline: z.string(),
    lede: z.string().optional(),
    capture: z.string(),
    /** Seconds at which the interface starts rising. */
    uiAt: z.number().default(1.4),
    disclosure: z.string().optional(),
  }),

  /** A guided move through a real product surface. */
  z.object({
    ...base,
    kind: z.literal("uiWalkthrough"),
    capture: z.string(),
    /** Second capture to cut to, for a state change within the scene. */
    thenCapture: z.string().optional(),
    thenAt: z.number().optional(),
    from: framingSchema.optional(),
    to: framingSchema.optional(),
    /** Seconds over which the framing move runs. */
    move: z.tuple([z.number(), z.number()]).optional(),
    caption: z.string().optional(),
    captionAt: z.number().default(0.3),
    url: z.string().optional(),
    cursor: z.array(cursorStopSchema).default([]),
    callouts: z.array(calloutSchema).default([]),
    field: z.enum(["deep", "light", "accent"]).default("light"),
  }),

  /** Two or three capabilities, each with a real interface excerpt. */
  z.object({
    ...base,
    kind: z.literal("featureMontage"),
    features: z
      .array(
        z.object({
          title: z.string(),
          line: z.string(),
          capture: z.string(),
          region: z.string().optional(),
        }),
      )
      .min(2)
      .max(4),
    eyebrow: z.string().optional(),
    field: z.enum(["deep", "light", "accent"]).default("light"),
  }),

  /**
   * One or two figures given the whole frame. Used where the point of the
   * beat is the number itself rather than an interface.
   */
  z.object({
    ...base,
    kind: z.literal("statBeat"),
    eyebrow: z.string().optional(),
    headline: z.array(z.string()).optional(),
    stats: z
      .array(
        z.object({
          value: z.string(),
          label: z.string(),
          /** A qualifying line under the label. Keep claims honest here. */
          note: z.string().optional(),
        }),
      )
      .min(1)
      .max(3),
    /** Treated backdrop from assets/derived, by capture id. */
    backdrop: z.string().optional(),
    /** Where the figures came from, shown small. */
    attribution: z.string().optional(),
    field: z.enum(["deep", "light", "accent"]).default("deep"),
  }),

  /** Who the product is for: a compact grid of audiences and outcomes. */
  z.object({
    ...base,
    kind: z.literal("audienceGrid"),
    eyebrow: z.string().optional(),
    headline: z.array(z.string()).optional(),
    audiences: z
      .array(
        z.object({
          name: z.string(),
          outcome: z.string(),
          impact: z.string(),
        }),
      )
      .min(2)
      .max(5),
    field: z.enum(["deep", "light", "accent"]).default("light"),
  }),

  /** Developer beat: a request, a wait, a response. */
  z.object({
    ...base,
    kind: z.literal("apiBeat"),
    eyebrow: z.string().optional(),
    title: z.string(),
    request: z.object({ method: z.string(), path: z.string() }),
    capture: z.string(),
    region: z.string().optional(),
    /** Seconds at which the response lands. */
    responseAt: z.number().default(1.6),
  }),

  /**
   * A conversation on a phone, replayed from a captured transcript.
   * Used for the WhatsApp Rep commercial.
   */
  z.object({
    ...base,
    kind: z.literal("chatDemo"),
    /** Transcript id, from `src/utils/transcripts.ts`. */
    transcript: z.string(),
    /** Slice of the transcript to replay, as turn indices. */
    fromTurn: z.number().default(0),
    toTurn: z.number().optional(),
    /** Multiplier on the derived pacing. */
    pace: z.number().default(1),
    contactName: z.string().default("MarketView Rep"),
    contactSubtitle: z.string().default("business account"),
    eyebrow: z.string().optional(),
    caption: z.string().optional(),
    /** Headline shown beside or above the phone. */
    headline: z.array(z.string()).optional(),
    disclosure: z.string().optional(),
    field: z.enum(["deep", "light", "accent"]).default("deep"),
  }),

  /** Brand close: identity, verified numbers, call to action. */
  z.object({
    ...base,
    kind: z.literal("closing"),
    statement: z.string(),
    stats: z.array(z.object({ value: z.string(), label: z.string() })).default([]),
    cta: z.string().optional(),
    website: z.string().optional(),
    /**
     * Programmes named in a strip under the call to action.
     *
     * Names only, never logos. A logo is someone else's trademark used in an
     * advertisement, which needs written permission and a current asset at the
     * right lockup; a set-in-type name under a neutral label is a far smaller
     * claim and is the form this end card ships in until permission exists at
     * all. `src/products/marketview.ts` holds whether it has been granted —
     * a storyboard that passes the list while the flag is false renders no
     * strip, so the copy can be written and reviewed ahead of the clearance.
     */
    partners: z.array(z.string()).default([]),
    /** Label above the strip, e.g. "Working with". */
    partnersLabel: z.string().optional(),
    /** Fade to the opening field so a loop edition joins cleanly. */
    loopSafe: z.boolean().default(false),
  }),
]);

export type Scene = z.infer<typeof sceneSchema>;
export type SceneKind = Scene["kind"];

export const storyboardSchema = z.object({
  id: z.string(),
  title: z.string(),
  /** Which narrative template this storyboard follows. */
  template: z.enum([
    "problemSolution",
    "featureAnnouncement",
    "developerIntegration",
    "beforeAfter",
    "statisticLed",
    "showcaseMontage",
    "conferenceLoop",
  ]),
  productId: z.string(),
  brandId: z.string(),
  format: formatIdSchema,
  /** Overrides the brand's motion personality. */
  motion: motionPersonalitySchema.optional(),
  audio: z
    .object({
      /** Music bed, relative to public/. */
      music: z.string().optional(),
      musicGain: z.number().default(0.5),
      /**
       * Seconds to skip into the music bed. A short film that starts at zero
       * gets the sparse introduction and nothing else; starting part-way in
       * gives it a section with some weight.
       */
      musicFrom: z.number().default(0),
      /** Narration track, relative to public/. */
      narration: z.string().optional(),
      narrationGain: z.number().default(1),
      /** Interface and reveal cues. */
      cues: z.boolean().default(true),
      /** Conference editions render silent regardless of the above. */
      silent: z.boolean().default(false),
    })
    .default({ musicGain: 0.5, musicFrom: 0, narrationGain: 1, cues: true, silent: false }),
  scenes: z.array(sceneSchema).min(1),
});

export type Storyboard = z.infer<typeof storyboardSchema>;

/** Scene duration in frames, with a floor of one frame. */
export const sceneFrames = (scene: Scene, fps: number): number =>
  Math.max(1, Math.round(scene.seconds * fps));

/** Transition duration in frames; `cut` is zero. */
export const transitionFrames = (t: TransitionSpec | undefined, fps: number): number =>
  !t || t.kind === "cut" ? 0 : Math.max(1, Math.round(t.seconds * fps));

/**
 * Total frames for a storyboard.
 *
 * Transitions overlap their neighbours, so the film is shorter than the sum of
 * its scenes. Getting this wrong is the single most common way a Remotion film
 * ends up with a black tail, so the composition derives its duration from here
 * rather than from a hand-written constant.
 */
export const storyboardFrames = (storyboard: Storyboard, fps: number): number => {
  const scenes = storyboard.scenes.reduce((n, s) => n + sceneFrames(s, fps), 0);
  const overlaps = storyboard.scenes
    .slice(0, -1)
    .reduce((n, s) => n + transitionFrames(s.transitionOut, fps), 0);
  return Math.max(1, scenes - overlaps);
};

/** What a storyboard author writes: defaults may be omitted. */
export type StoryboardInput = z.input<typeof storyboardSchema>;

/**
 * Validates an authored storyboard and fills in defaults.
 *
 * Authoring happens in TypeScript, so most mistakes are caught by the compiler;
 * this catches the rest (an unknown scene kind, a negative duration, a colour
 * that is not a colour) at module load with a readable message instead of a
 * blank frame.
 */
export const defineStoryboard = (input: StoryboardInput): Storyboard => {
  const result = storyboardSchema.safeParse(input);
  if (!result.success) {
    throw new Error(
      `Invalid storyboard "${input.id}":\n` +
        result.error.issues
          .map((i) => `  • ${i.path.join(".") || "(root)"}: ${i.message}`)
          .join("\n"),
    );
  }
  return result.data;
};
