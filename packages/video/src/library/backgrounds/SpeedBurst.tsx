import type React from "react";
import { AbsoluteFill, random, useCurrentFrame } from "remotion";
import { withAlpha } from "../../util";
import type { BackgroundProps } from "../types";

/** Radial speed lines in brand colors: high-energy backdrop for punches and deadlines. */
export const SpeedBurst: React.FC<BackgroundProps> = ({ palette, seed }) => {
  const frame = useCurrentFrame();
  const rays = 36;
  return (
    <AbsoluteFill style={{ backgroundColor: palette.deep, overflow: "hidden" }}>
      <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 38%, ${withAlpha(palette.primary, 0.55)} 0%, transparent 60%)` }} />
      <svg width="1080" height="1920" viewBox="0 0 1080 1920" style={{ position: "absolute", inset: 0 }}>
        {Array.from({ length: rays }, (_, i) => {
          const angle = (i / rays) * Math.PI * 2 + random(`${seed}a${i}`) * 0.08;
          const speed = 0.06 + random(`${seed}v${i}`) * 0.08;
          const t = (frame * speed + random(`${seed}p${i}`)) % 1;
          const r0 = 120 + t * 900;
          const r1 = r0 + 140 + random(`${seed}l${i}`) * 260;
          const cx = 540;
          const cy = 730;
          const color = i % 3 === 0 ? palette.accent : "#FFFFFF";
          return (
            <line
              key={i}
              x1={cx + Math.cos(angle) * r0}
              y1={cy + Math.sin(angle) * r0}
              x2={cx + Math.cos(angle) * r1}
              y2={cy + Math.sin(angle) * r1}
              stroke={color}
              strokeOpacity={0.12 + (1 - t) * 0.25}
              strokeWidth={3 + random(`${seed}w${i}`) * 5}
              strokeLinecap="round"
            />
          );
        })}
      </svg>
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at center, rgba(0,0,0,0) 40%, rgba(0,0,0,0.6) 100%)" }} />
    </AbsoluteFill>
  );
};
