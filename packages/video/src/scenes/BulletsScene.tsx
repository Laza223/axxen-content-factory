import { BEATS, type SceneOf } from "@axxen/core";
import type React from "react";
import { AbsoluteFill, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { Backdrop } from "../components/Backdrop";
import { CheckIcon } from "../components/Icons";
import { DisplayText, UiText } from "../components/Text";
import { useTheme } from "../theme";
import { CONTENT, RUBRO_MOOD } from "./layout";

export const BulletsScene: React.FC<{ scene: SceneOf<"bullets"> }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = useTheme();
  const titleIn = spring({ frame, fps, config: { damping: 15 } });

  return (
    <AbsoluteFill>
      <Backdrop mood={RUBRO_MOOD[t.brand.rubro]} background={scene.background} durationInFrames={scene.durationInFrames} seed={`${t.brand.name}-${scene.type}`} dim={0.5} />
      <div style={{ position: "absolute", top: CONTENT.top + 20, left: CONTENT.left, opacity: titleIn, transform: `translateY(${(1 - titleIn) * -40}px)` }}>
        <DisplayText text={scene.title} maxWidth={CONTENT.width} maxSize={104} maxLines={2} />
      </div>
      <div style={{ position: "absolute", top: 560, left: CONTENT.left, width: CONTENT.width, display: "flex", flexDirection: "column", gap: 26 }}>
        {scene.items.map((item, i) => {
          const s = spring({ frame: frame - BEATS.bulletsItem(scene, i), fps, config: { damping: 14, stiffness: 160 } });
          return (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 26,
                padding: "22px 30px",
                borderRadius: 30,
                backgroundColor: "rgba(0,0,0,0.42)",
                border: "2px solid rgba(255,255,255,0.12)",
                opacity: s,
                transform: `translateX(${(1 - s) * -220}px)`,
              }}
            >
              <CheckIcon size={80} bg={t.accent} fg={t.onAccent} />
              <UiText text={item} maxWidth={700} maxSize={54} weight={800} maxLines={2} color="#FFFFFF" />
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
