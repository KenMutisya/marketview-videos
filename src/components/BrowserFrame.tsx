import React from "react";
import { useBrand } from "../utils/studio";

export type BrowserFrameProps = {
  width: number;
  height: number;
  /** Shown in the address pill. Keep it real. */
  url?: string;
  children: React.ReactNode;
  /** Chrome height scales with the frame so it reads at any output size. */
  scale?: number;
  style?: React.CSSProperties;
  elevation?: number;
};

/**
 * Minimal application window.
 *
 * Deliberately not a photoreal browser: a product film wants the product, not
 * the browser. A thin chrome strip plus a soft elevation is enough to say
 * "this is real software running somewhere".
 */
export const BrowserFrame: React.FC<BrowserFrameProps> = ({
  width,
  height,
  url,
  children,
  scale = 1,
  style,
  elevation = 1,
}) => {
  const brand = useBrand();
  const bar = Math.round(46 * scale);
  const radius = Math.round(brand.radius.xl * scale);
  const dot = Math.round(11 * scale);

  return (
    <div
      style={{
        width,
        height: height + bar,
        borderRadius: radius,
        overflow: "hidden",
        background: brand.colors.surface,
        boxShadow: [
          `0 ${2 * elevation}px ${8 * elevation}px rgba(13,20,55,${0.06 * elevation})`,
          `0 ${18 * elevation}px ${44 * elevation}px rgba(13,20,55,${0.14 * elevation})`,
          `0 ${56 * elevation}px ${120 * elevation}px rgba(13,20,55,${0.20 * elevation})`,
        ].join(", "),
        border: `1px solid rgba(255,255,255,0.5)`,
        ...style,
      }}
    >
      <div
        style={{
          height: bar,
          display: "flex",
          alignItems: "center",
          gap: dot,
          paddingLeft: bar * 0.45,
          paddingRight: bar * 0.45,
          background: brand.colors.surfaceSunken,
          borderBottom: `1px solid ${brand.colors.border}`,
        }}
      >
        {["#E2E6EC", "#E2E6EC", "#E2E6EC"].map((c, i) => (
          <span
            key={i}
            style={{ width: dot, height: dot, borderRadius: dot, background: c }}
          />
        ))}
        {url ? (
          <div
            style={{
              marginLeft: bar * 0.4,
              height: bar * 0.56,
              flex: 1,
              maxWidth: width * 0.42,
              borderRadius: bar,
              background: "#FFFFFF",
              border: `1px solid ${brand.colors.border}`,
              display: "flex",
              alignItems: "center",
              paddingLeft: bar * 0.4,
              fontFamily: brand.fontFamily,
              fontSize: Math.round(17 * scale),
              fontWeight: 500,
              color: brand.colors.inkFaint,
              letterSpacing: 0.1,
            }}
          >
            {url}
          </div>
        ) : null}
      </div>
      <div style={{ width, height, position: "relative" }}>{children}</div>
    </div>
  );
};
