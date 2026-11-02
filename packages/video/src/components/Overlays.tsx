import { SAFE_ZONE } from "@axxen/core";
import type React from "react";
import { AbsoluteFill, Img, interpolate, useCurrentFrame } from "remotion";
import { UI_FONT } from "../fonts";
import { useTheme } from "../theme";
import { resolveSrc } from "../util";

/** Small logo badge, top-left, just below Instagram's top bar. */
export const LogoBadge: React.FC = () => {
  const t = useTheme();
  return (
    <div
      style={{
        position: "absolute",
        top: SAFE_ZONE.top + 10,
        left: SAFE_ZONE.left,
        height: 110,
        padding: "12px 22px",
        borderRadius: 26,
        backgroundColor: "rgba(255,255,255,0.92)",
        boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
        display: "flex",
        alignItems: "center",
      }}
    >
      <Img src={resolveSrc(t.brand.logo)} style={{ height: "100%", objectFit: "contain" }} />
    </div>
  );
};

/** Cinematic bars that open during the first second. */
export const LetterboxIntro: React.FC = () => {
  const frame = useCurrentFrame();
  const h = interpolate(frame, [0, 26], [300, 0], { extrapolateRight: "clamp" });
  if (h <= 0) return null;
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: h, backgroundColor: "#000" }} />
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: h, backgroundColor: "#000" }} />
    </AbsoluteFill>
  );
};

/** Two-frame flash at a cut. Mount inside the scene's Sequence. */
export const CutFlash: React.FC<{ color: string }> = ({ color }) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 3], [0.5, 0], { extrapolateRight: "clamp" });
  if (opacity <= 0) return null;
  return <AbsoluteFill style={{ backgroundColor: color, opacity }} />;
};

/** Free-preview watermark: visible enough that the preview cannot be published as is. */
export const PreviewWatermark: React.FC = () => {
  const rows = Array.from({ length: 9 }, (_, i) => i);
  return (
    <AbsoluteFill style={{ pointerEvents: "none", overflow: "hidden" }}>
      <AbsoluteFill style={{ transform: "rotate(-24deg) scale(1.5)", justifyContent: "space-around" }}>
        {rows.map((i) => (
          <div
            key={i}
            style={{
              whiteSpace: "nowrap",
              fontFamily: `"${UI_FONT}"`,
              fontWeight: 900,
              fontSize: 58,
              letterSpacing: "0.08em",
              color: "rgba(255,255,255,0.2)",
              WebkitTextStroke: "2px rgba(0,0,0,0.12)",
              marginLeft: (i % 2) * -260,
            }}
          >
            VISTA PREVIA · AXXEN · VISTA PREVIA · AXXEN · VISTA PREVIA
          </div>
        ))}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
