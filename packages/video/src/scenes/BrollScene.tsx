import type { SceneOf } from "@axxen/core";
import type React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { Backdrop } from "../components/Backdrop";
import { DisplayText } from "../components/Text";
import { useTheme } from "../theme";
import { CONTENT } from "./layout";

export const BrollScene: React.FC<{ scene: SceneOf<"broll"> }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = useTheme();
  const zoom = interpolate(frame, [0, scene.durationInFrames], [1, 1.08]);
  const enter = spring({ frame: frame - 4, fps, config: { damping: 16 } });
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ transform: `scale(${zoom})` }}>
        <Backdrop mood={scene.mood} background={scene.background} durationInFrames={scene.durationInFrames} seed={`${t.brand.name}-${scene.type}`} dim={scene.text ? 0.55 : 0.25} />
      </AbsoluteFill>
      {scene.text ? (
        <div
          style={{
            position: "absolute",
            top: CONTENT.top,
            left: CONTENT.left,
            width: CONTENT.width,
            height: CONTENT.bottom - CONTENT.top,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            opacity: enter,
            transform: `translateY(${(1 - enter) * 50}px)`,
          }}
        >
          <DisplayText text={scene.text} maxWidth={CONTENT.width} maxSize={150} maxLines={3} />
        </div>
      ) : null}
    </AbsoluteFill>
  );
};
