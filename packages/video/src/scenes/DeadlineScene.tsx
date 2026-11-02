import { BEATS, type SceneOf } from "@axxen/core";
import type React from "react";
import { AbsoluteFill, random, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { Backdrop } from "../components/Backdrop";
import { ClockIcon } from "../components/Icons";
import { DisplayText, UiText } from "../components/Text";
import { useTheme } from "../theme";
import { withAlpha } from "../util";
import { CONTENT } from "./layout";

export const DeadlineScene: React.FC<{ scene: SceneOf<"deadline"> }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = useTheme();
  const pop = spring({ frame, fps, config: { damping: 10, stiffness: 220 } });
  const pulse = 0.5 + 0.5 * Math.sin(frame / 3);
  const shake = t.style.shake && frame < 10 ? (random(`d${frame}`) - 0.5) * 18 : 0;
  const pillIn = spring({ frame: frame - BEATS.deadlinePill, fps, config: { damping: 14 } });

  return (
    <AbsoluteFill style={{ transform: `translate(${shake}px, ${-shake * 0.5}px)` }}>
      <Backdrop mood="energia" background={scene.background} durationInFrames={scene.durationInFrames} seed={`${t.brand.name}-${scene.type}`} dim={0.45} />
      <AbsoluteFill style={{ backgroundColor: withAlpha(t.accent, 0.12 * pulse) }} />
      <div style={{ position: "absolute", top: 290, left: (1080 - 260) / 2, transform: `scale(${pop * (1 + 0.05 * pulse)})` }}>
        <ClockIcon size={260} color={t.accent} handAngle={frame * 14} />
      </div>
      <div style={{ position: "absolute", top: 600, left: CONTENT.left, transform: `scale(${0.7 + 0.3 * pop})` }}>
        <DisplayText text={scene.headline} maxWidth={CONTENT.width} maxSize={150} maxLines={2} />
      </div>
      <div style={{ position: "absolute", top: 930, left: CONTENT.left, width: CONTENT.width, display: "flex", justifyContent: "center", opacity: pillIn, transform: `translateY(${(1 - pillIn) * 60}px)` }}>
        <div style={{ padding: "22px 44px", borderRadius: 999, backgroundColor: t.accent, boxShadow: "0 16px 40px rgba(0,0,0,0.4)" }}>
          <UiText text={scene.deadline} maxWidth={760} maxSize={54} weight={900} maxLines={2} color={t.onAccent} style={{ textAlign: "center" }} />
        </div>
      </div>
    </AbsoluteFill>
  );
};
