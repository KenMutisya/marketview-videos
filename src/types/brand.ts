import { z } from "zod";
import { zColor } from "@remotion/zod-types";

/**
 * Motion personality decides *how* things move; the brand decides how they
 * look. Swapping personality must not require touching a scene.
 */
export const motionPersonalitySchema = z.enum([
  "minimalPremium",
  "highEnergyTech",
  "developerFocused",
  "enterprise",
  "conferenceDisplay",
]);
export type MotionPersonalityId = z.infer<typeof motionPersonalitySchema>;

export type MotionPersonality = {
  id: MotionPersonalityId;
  label: string;
  /** Spring used for entrances. */
  entrance: { damping: number; mass: number; stiffness: number };
  /** Spring used for emphatic, snappier moves. */
  accent: { damping: number; mass: number; stiffness: number };
  /** Frames between staggered children. */
  stagger: number;
  /** Frames a standard fade/slide takes. */
  revealFrames: number;
  /** How far the camera drifts, as a fraction of frame width. */
  cameraDrift: number;
  /** How much a slow push-in scales over a scene. */
  cameraZoom: number;
};

export const MOTION_PERSONALITIES: Record<MotionPersonalityId, MotionPersonality> = {
  minimalPremium: {
    id: "minimalPremium",
    label: "Minimal Premium",
    entrance: { damping: 200, mass: 1.1, stiffness: 90 },
    accent: { damping: 26, mass: 0.7, stiffness: 150 },
    stagger: 3,
    revealFrames: 24,
    cameraDrift: 0.022,
    cameraZoom: 0.08,
  },
  highEnergyTech: {
    id: "highEnergyTech",
    label: "High-Energy Tech",
    entrance: { damping: 18, mass: 0.6, stiffness: 190 },
    accent: { damping: 13, mass: 0.5, stiffness: 240 },
    stagger: 2,
    revealFrames: 14,
    cameraDrift: 0.05,
    cameraZoom: 0.16,
  },
  developerFocused: {
    id: "developerFocused",
    label: "Developer-Focused",
    entrance: { damping: 40, mass: 0.8, stiffness: 120 },
    accent: { damping: 22, mass: 0.6, stiffness: 180 },
    stagger: 2,
    revealFrames: 18,
    cameraDrift: 0.016,
    cameraZoom: 0.06,
  },
  enterprise: {
    id: "enterprise",
    label: "Enterprise",
    entrance: { damping: 200, mass: 1.3, stiffness: 72 },
    accent: { damping: 34, mass: 0.9, stiffness: 120 },
    stagger: 4,
    revealFrames: 28,
    cameraDrift: 0.014,
    cameraZoom: 0.05,
  },
  conferenceDisplay: {
    id: "conferenceDisplay",
    label: "Conference Display",
    entrance: { damping: 200, mass: 1.2, stiffness: 80 },
    accent: { damping: 30, mass: 0.9, stiffness: 130 },
    stagger: 5,
    revealFrames: 30,
    cameraDrift: 0.01,
    cameraZoom: 0.05,
  },
};

export const brandSchema = z.object({
  id: z.string(),
  name: z.string(),
  tagline: z.string(),
  website: z.string(),
  cta: z.string(),
  colors: z.object({
    /** Primary brand colour; used for emphasis and dark fields. */
    primary: zColor(),
    primaryDeep: zColor(),
    primaryLift: zColor(),
    /** Secondary / supporting brand colour. */
    accent: zColor(),
    accentDeep: zColor(),
    /** Logo-exact colours; the mark is the authority, not the UI tokens. */
    logoNavy: zColor(),
    logoGreen: zColor(),
    logoTeal: zColor(),
    /** Surfaces. */
    ink: zColor(),
    inkSoft: zColor(),
    inkFaint: zColor(),
    surface: zColor(),
    surfaceSunken: zColor(),
    border: zColor(),
    /** Status. Never used decoratively. */
    good: zColor(),
    warn: zColor(),
    bad: zColor(),
    info: zColor(),
  }),
  fontFamily: z.string(),
  monoFamily: z.string(),
  radius: z.object({ sm: z.number(), md: z.number(), lg: z.number(), xl: z.number() }),
  logo: z.object({ mark: z.string() }),
  motion: motionPersonalitySchema,
});

export type Brand = z.infer<typeof brandSchema>;
