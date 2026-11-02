import type React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { withAlpha } from "../../util";
import type { BackgroundProps } from "../types";
import { Grain } from "./BrandAurora";

/** Dark stage with a soft spotlight and a glossy podium: made for product hero shots. */
export const SpotlightPodium: React.FC<BackgroundProps> = ({ palette, durationInFrames }) => {
  const frame = useCurrentFrame();
  const open = interpolate(frame, [0, 18], [0.4, 1], { extrapolateRight: "clamp" });
  const sway = Math.sin((frame / Math.max(durationInFrames, 1)) * Math.PI * 2) * 3;
  return (
    <AbsoluteFill style={{ background: `radial-gradient(ellipse at 50% 35%, ${palette.background} 0%, ${palette.deep} 70%, #000 100%)` }}>
      <AbsoluteFill
        style={{
          opacity: open,
          transform: `rotate(${sway}deg)`,
          transformOrigin: "50% 0%",
          background: `conic-gradient(from 168deg at 50% -6%, transparent 0deg, ${withAlpha("#FFFFFF", 0.16)} 12deg, ${withAlpha(palette.accent, 0.12)} 24deg, transparent 36deg)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 120,
          width: 840,
          top: 860,
          height: 170,
          borderRadius: "50%",
          background: `radial-gradient(ellipse at 50% 35%, ${withAlpha(palette.primary, 0.85)} 0%, ${withAlpha(palette.primary, 0.35)} 55%, transparent 72%)`,
          boxShadow: `0 -10px 60px ${withAlpha(palette.accent, 0.25)}`,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 200,
          width: 680,
          top: 880,
          height: 50,
          borderRadius: "50%",
          background: `linear-gradient(90deg, transparent, ${withAlpha("#FFFFFF", 0.35)}, transparent)`,
          filter: "blur(6px)",
        }}
      />
      <Grain />
    </AbsoluteFill>
  );
};
