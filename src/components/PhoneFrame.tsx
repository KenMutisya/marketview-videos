import React from "react";

export type PhoneFrameProps = {
  /** Screen width in px; the device is sized from it. */
  screenWidth: number;
  screenHeight: number;
  children: React.ReactNode;
  style?: React.CSSProperties;
  /** Shadow strength. */
  elevation?: number;
};

/**
 * A phone, drawn rather than photographed.
 *
 * Deliberately generic: a recognisable slab with a thin bezel and a pill
 * cut-out, not a replica of any manufacturer's industrial design. The film
 * needs the *idea* of a phone — this is a conversation in someone's hand —
 * and a traced handset would put someone else's trade dress in a product ad.
 */
export const PhoneFrame: React.FC<PhoneFrameProps> = ({
  screenWidth,
  screenHeight,
  children,
  style,
  elevation = 1,
}) => {
  const bezel = Math.round(screenWidth * 0.028);
  const radius = Math.round(screenWidth * 0.125);
  const outerW = screenWidth + bezel * 2;
  const outerH = screenHeight + bezel * 2;
  const island = { w: Math.round(screenWidth * 0.30), h: Math.round(screenWidth * 0.085) };

  return (
    <div
      style={{
        width: outerW,
        height: outerH,
        borderRadius: radius + bezel,
        padding: bezel,
        background: "linear-gradient(155deg, #3A4152 0%, #171C27 42%, #0B0E16 100%)",
        boxShadow: [
          `0 ${2 * elevation}px ${6 * elevation}px rgba(5,8,22,0.20)`,
          `0 ${22 * elevation}px ${48 * elevation}px rgba(5,8,22,0.34)`,
          `0 ${70 * elevation}px ${140 * elevation}px rgba(5,8,22,0.40)`,
          // A hairline of reflected light along the top edge.
          "inset 0 1px 0 rgba(255,255,255,0.22)",
          "inset 0 -1px 0 rgba(255,255,255,0.06)",
        ].join(", "),
        position: "relative",
        ...style,
      }}
    >
      <div
        style={{
          width: screenWidth,
          height: screenHeight,
          borderRadius: radius,
          overflow: "hidden",
          position: "relative",
          background: "#000",
        }}
      >
        {children}
        {/* Camera / sensor cut-out, drawn over the screen as a real one is. */}
        <div
          style={{
            position: "absolute",
            top: Math.round(screenWidth * 0.028),
            left: "50%",
            transform: "translateX(-50%)",
            width: island.w,
            height: island.h,
            borderRadius: island.h,
            background: "#06080E",
            zIndex: 5,
          }}
        />
      </div>
    </div>
  );
};
