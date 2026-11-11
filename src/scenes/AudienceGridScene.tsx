import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import type { Scene } from "../types/storyboard";
import { SceneFrame } from "./SceneFrame";
import { Eyebrow, KineticHeadline } from "../typography/Text";
import { reveal } from "../motion/timing";
import { fitSize } from "../typography/fit";
import { snap } from "../utils/pixels";
import { useBrand, useFormat, useMotion, useSafeBox } from "../utils/studio";

type Props = Extract<Scene, { kind: "audienceGrid" }>;

/**
 * Who the product is for.
 *
 * Each audience carries an outcome and an impact, which is the distinction
 * worth preserving: the outcome is what the customer gets, the impact is what
 * changes in the market because of it. Collapsing the two into one benefit
 * line would lose the second, which for this product is the more interesting
 * half.
 *
 * Cards arrive left to right so the row reads as a sentence rather than
 * appearing all at once as a table.
 */
export const AudienceGridScene: React.FC<{ scene: Props }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const format = useFormat();
  const brand = useBrand();
  const motion = useMotion();
  const safe = useSafeBox();

  const onLight = scene.field === "light";
  const tone = onLight ? "onLight" : "onDark";
  const column = format.uiPresentation === "column";
  const n = scene.audiences.length;
  const headlineLines = scene.headline ?? [];

  const headerH =
    (scene.eyebrow ? format.type.meta * 2.6 : 0) +
    (headlineLines.length ? format.type.title * 0.9 * headlineLines.length + format.type.body : 0);

  const gap = column ? format.type.body * 0.6 : format.type.body * 0.8;
  const cardW = column ? safe.width : (safe.width - gap * (n - 1)) / n;
  // Cards are sized to roughly what their two short paragraphs need, then the
  // row is centred in what is left. Stretching them to the full height leaves
  // more empty card than text.
  const available = safe.height - headerH;
  const cardH = column
    ? (available - gap * (n - 1)) / n
    : Math.min(available, format.height * 0.44);

  return (
    <SceneFrame field={scene.field} vignette={onLight ? 0.12 : undefined}>
      {scene.eyebrow ? (
        <Eyebrow delay={0} tone={tone} color={onLight ? brand.colors.primary : undefined}>
          {scene.eyebrow}
        </Eyebrow>
      ) : null}

      {headlineLines.length ? (
        <div style={{ marginTop: format.type.meta * 0.8 }}>
          <KineticHeadline
            lines={headlineLines}
            delay={4}
            tone={tone}
            size={fitSize(headlineLines, safe.width, format.type.title * 0.8)}
          />
        </div>
      ) : null}

      <AbsoluteFill
        style={{
          top: headerH,
          height: available,
          display: "flex",
          flexDirection: column ? "column" : "row",
          alignItems: column ? "stretch" : "center",
          gap,
        }}
      >
        {scene.audiences.map((a, i) => {
          const p = reveal({ frame, fps, delay: 8 + i * motion.stagger * 2.2, motion });
          const accent = i % 2 === 0 ? brand.colors.logoGreen : brand.colors.accent;
          return (
            <div
              key={a.name}
              style={{
                width: cardW,
                height: cardH,
                opacity: p,
                transform: p >= 0.999 ? "none" : `translate3d(0, ${snap((1 - p) * 34)}px, 0)`,
                background: onLight ? "#FFFFFF" : "rgba(255,255,255,0.055)",
                border: `1px solid ${onLight ? brand.colors.border : "rgba(255,255,255,0.12)"}`,
                borderTop: `3px solid ${accent}`,
                borderRadius: brand.radius.md,
                boxShadow: onLight
                  ? "0 14px 34px rgba(13,20,55,0.09), 0 2px 5px rgba(13,20,55,0.05)"
                  : "0 20px 48px rgba(0,0,0,0.3)",
                padding: format.type.body * 0.8,
                display: "flex",
                flexDirection: "column",
                gap: format.type.meta * 0.7,
              }}
            >
              <div
                style={{
                  fontFamily: brand.fontFamily,
                  fontSize: format.type.head * 0.82,
                  fontWeight: 800,
                  letterSpacing: -format.type.head * 0.02,
                  color: onLight ? brand.colors.logoNavy : "#FFFFFF",
                }}
              >
                {a.name}
              </div>
              {(
                [
                  ["Outcome", a.outcome],
                  ["Impact", a.impact],
                ] as const
              ).map(([label, text]) => (
                <div key={label}>
                  <div
                    style={{
                      fontFamily: brand.fontFamily,
                      fontSize: format.type.meta * 0.86,
                      fontWeight: 700,
                      letterSpacing: format.type.meta * 0.08,
                      textTransform: "uppercase",
                      color: onLight ? brand.colors.inkFaint : "rgba(255,255,255,0.45)",
                      marginBottom: format.type.meta * 0.22,
                    }}
                  >
                    {label}
                  </div>
                  <div
                    style={{
                      fontFamily: brand.fontFamily,
                      fontSize: format.type.body * 0.82,
                      lineHeight: 1.34,
                      fontWeight: 450,
                      color: onLight ? brand.colors.inkSoft : "rgba(255,255,255,0.74)",
                    }}
                  >
                    {text}
                  </div>
                </div>
              ))}
            </div>
          );
        })}
      </AbsoluteFill>
    </SceneFrame>
  );
};
