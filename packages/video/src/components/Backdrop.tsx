import type { BackgroundRef, Mood } from "@axxen/core";
import type React from "react";
import { AbsoluteFill, OffthreadVideo } from "remotion";
import { BACKGROUND_COMPONENTS, DEFAULT_BACKGROUND_ID } from "../library/registry";
import { useTheme } from "../theme";
import { resolveSrc } from "../util";

interface Props {
  mood: Mood;
  /** Chosen by the asset router. Absent → the default library background. */
  background?: BackgroundRef;
  durationInFrames: number;
  seed: string;
  /** Extra darkening for text readability over video clips, 0..1. */
  dim?: number;
}

export const Backdrop: React.FC<Props> = ({ mood, background, durationInFrames, seed, dim = 0.35 }) => {
  const t = useTheme();

  if (background?.kind === "clip") {
    return (
      <AbsoluteFill style={{ backgroundColor: t.deep }}>
        <OffthreadVideo
          src={resolveSrc(background.src)}
          trimBefore={background.startFromFrame}
          muted
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
        <AbsoluteFill
          style={{
            background: `linear-gradient(180deg, rgba(0,0,0,${dim * 0.6}) 0%, rgba(0,0,0,${dim * 0.2}) 35%, rgba(0,0,0,${dim}) 100%)`,
          }}
        />
      </AbsoluteFill>
    );
  }

  const id = background?.kind === "component" ? background.id : DEFAULT_BACKGROUND_ID;
  // An unknown id (e.g. a library entry removed after a spec was saved) falls back to the default.
  const Component = BACKGROUND_COMPONENTS[id] ?? BACKGROUND_COMPONENTS[DEFAULT_BACKGROUND_ID]!;
  return (
    <Component
      palette={{ primary: t.primary, secondary: t.secondary, accent: t.accent, background: t.background, deep: t.deep }}
      mood={mood}
      durationInFrames={durationInFrames}
      seed={seed}
    />
  );
};
