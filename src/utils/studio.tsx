import React, { createContext, useContext, useMemo } from "react";
import type { Brand, MotionPersonality, MotionPersonalityId } from "../types/brand";
import { MOTION_PERSONALITIES } from "../types/brand";
import type { FormatId, FormatSpec } from "../types/format";
import { FORMATS } from "../types/format";

type StudioValue = {
  brand: Brand;
  format: FormatSpec;
  motion: MotionPersonality;
};

const StudioContext = createContext<StudioValue | null>(null);

export const StudioProvider: React.FC<{
  brand: Brand;
  format: FormatId;
  /** Overrides the brand's own personality, e.g. for the conference edition. */
  motion?: MotionPersonalityId;
  children: React.ReactNode;
}> = ({ brand, format, motion, children }) => {
  const value = useMemo<StudioValue>(
    () => ({
      brand,
      format: FORMATS[format],
      motion: MOTION_PERSONALITIES[motion ?? brand.motion],
    }),
    [brand, format, motion],
  );
  return <StudioContext.Provider value={value}>{children}</StudioContext.Provider>;
};

const useStudio = (): StudioValue => {
  const v = useContext(StudioContext);
  if (!v) {
    throw new Error("Studio hooks must be used inside <StudioProvider>.");
  }
  return v;
};

export const useBrand = (): Brand => useStudio().brand;
export const useFormat = (): FormatSpec => useStudio().format;
export const useMotion = (): MotionPersonality => useStudio().motion;

/** Horizontal gutter + usable width, honouring the format's safe area. */
export const useSafeBox = () => {
  const f = useFormat();
  return {
    left: f.safe.left,
    top: f.safe.top,
    width: f.width - f.safe.left - f.safe.right,
    height: f.height - f.safe.top - f.safe.bottom,
  };
};
