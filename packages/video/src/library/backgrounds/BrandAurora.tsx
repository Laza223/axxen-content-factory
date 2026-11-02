import type { Mood } from "@axxen/core";
import type React from "react";
import { AbsoluteFill, interpolate, random, useCurrentFrame, useVideoConfig } from "remotion";
import { mix, withAlpha } from "../../util";
import type { BackgroundProps } from "../types";

const MOOD_TINT: Record<Mood, string> = {
  fuego: "#FF5A1F",
  lujo: "#D4AF37",
  urbano: "#2EE6FF",
  fresco: "#5AD1FF",
  calido: "#FF9F43",
  energia: "#FF2E88",
};

/** Default backdrop: drifting brand-colored light, mood accents, grain and vignette. */
export const BrandAurora: React.FC<BackgroundProps> = ({ palette, mood, seed }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const tint = MOOD_TINT[mood];
  const phase = random(seed) * 10;
  const blobs = [
    { color: palette.primary, x: 0.25, y: 0.3, r: 0.75, speed: 0.011, phase },
    { color: tint, x: 0.8, y: 0.62, r: 0.65, speed: 0.008, phase: phase + 2 },
    { color: palette.accent, x: 0.35, y: 0.88, r: 0.55, speed: 0.013, phase: phase + 4 },
  ];
  const particles = mood === "fuego" || mood === "calido" || mood === "energia";

  return (
    <AbsoluteFill style={{ background: `linear-gradient(170deg, ${palette.background} 0%, ${palette.deep} 100%)`, overflow: "hidden" }}>
      {blobs.map((b, i) => {
        const cx = (b.x + Math.sin(frame * b.speed + b.phase) * 0.08) * width;
        const cy = (b.y + Math.cos(frame * b.speed * 0.8 + b.phase) * 0.06) * height;
        const size = b.r * width * 1.6;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: cx - size / 2,
              top: cy - size / 2,
              width: size,
              height: size,
              borderRadius: "50%",
              background: `radial-gradient(circle, ${withAlpha(b.color, 0.55)} 0%, ${withAlpha(b.color, 0)} 65%)`,
            }}
          />
        );
      })}
      {mood === "lujo" || mood === "urbano" ? <Sheen color={tint} /> : null}
      {particles ? <Embers color={mix(tint, "#FFFFFF", 0.25)} seed={seed} /> : null}
      <Grain />
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at center, rgba(0,0,0,0) 45%, rgba(0,0,0,0.55) 100%)" }} />
    </AbsoluteFill>
  );
};

const Sheen: React.FC<{ color: string }> = ({ color }) => {
  const frame = useCurrentFrame();
  const x = interpolate(frame % 90, [0, 90], [-60, 160]);
  return (
    <AbsoluteFill
      style={{ opacity: 0.35, background: `linear-gradient(115deg, transparent ${x - 12}%, ${withAlpha(color, 0.5)} ${x}%, transparent ${x + 12}%)` }}
    />
  );
};

const Embers: React.FC<{ color: string; seed: string }> = ({ color, seed }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  return (
    <AbsoluteFill>
      {Array.from({ length: 34 }, (_, i) => {
        const speed = 2 + random(`${seed}s${i}`) * 5;
        const size = 4 + random(`${seed}z${i}`) * 9;
        const y = height - ((frame * speed + random(`${seed}y${i}`) * height) % (height + 100));
        const x = random(`${seed}x${i}`) * width + Math.sin(frame / 18 + i) * 24;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x,
              top: y,
              width: size,
              height: size,
              borderRadius: "50%",
              backgroundColor: color,
              opacity: 0.25 + random(`${seed}o${i}`) * 0.6,
              boxShadow: `0 0 ${size * 2}px ${color}`,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

/** Static film grain; keeps flat gradients from banding after H.264 compression. */
export const Grain: React.FC = () => (
  <AbsoluteFill style={{ opacity: 0.09, mixBlendMode: "overlay" }}>
    <svg width="100%" height="100%">
      <filter id="grain">
        <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" />
      </filter>
      <rect width="100%" height="100%" filter="url(#grain)" />
    </svg>
  </AbsoluteFill>
);
