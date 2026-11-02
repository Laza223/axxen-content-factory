import { BEATS, type SceneOf } from "@axxen/core";
import type React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { Backdrop } from "../components/Backdrop";
import { DisplayText } from "../components/Text";
import { useTheme } from "../theme";
import { CONTENT, RUBRO_MOOD } from "./layout";

export const TextPunchScene: React.FC<{ scene: SceneOf<"text_punch"> }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = useTheme();
  const band = spring({ frame, fps, config: { damping: 20, stiffness: 120 } });
  return (
    <AbsoluteFill>
      <Backdrop mood={RUBRO_MOOD[t.brand.rubro]} background={scene.background} durationInFrames={scene.durationInFrames} seed={`${t.brand.name}-${scene.type}`} dim={0.4} />
      <div
        style={{
          position: "absolute",
          left: -200,
          right: -200,
          top: 490,
          height: 420,
          backgroundColor: t.primary,
          opacity: 0.9,
          transform: `rotate(-7deg) translateX(${(1 - band) * -1400}px)`,
          boxShadow: "0 30px 80px rgba(0,0,0,0.4)",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: CONTENT.top,
          left: CONTENT.left,
          width: CONTENT.width,
          height: CONTENT.bottom - CONTENT.top,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 18,
        }}
      >
        {scene.lines.map((line, i) => {
          const s = spring({ frame: frame - BEATS.textPunchLine(i), fps, config: { damping: 12, stiffness: 200 } });
          const highlighted = scene.highlight === i;
          const marker = interpolate(frame - 8 - i * 5, [0, 8], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          return (
            <div key={i} style={{ position: "relative", opacity: s, transform: `scale(${1.5 - 0.5 * s})` }}>
              {highlighted ? (
                <div
                  style={{
                    position: "absolute",
                    inset: "-6px -24px",
                    backgroundColor: t.accent,
                    borderRadius: 18,
                    transform: `scaleX(${marker}) rotate(-1.5deg)`,
                    transformOrigin: "left center",
                  }}
                />
              ) : null}
              <DisplayText
                text={line}
                maxWidth={CONTENT.width - 40}
                maxSize={156}
                maxLines={1}
                color={highlighted ? t.onAccent : "#FFFFFF"}
                shadow={!highlighted}
                style={{ position: "relative", width: "auto", maxWidth: CONTENT.width - 40 }}
              />
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
