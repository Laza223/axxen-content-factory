import { BEATS, type SceneOf } from "@axxen/core";
import type React from "react";
import { AbsoluteFill, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { Backdrop } from "../components/Backdrop";
import { StarIcon } from "../components/Icons";
import { UiText } from "../components/Text";
import { UI_FONT } from "../fonts";
import { useTheme } from "../theme";
import { readableOn } from "../util";

const SOURCE_LABEL = {
  google: "Reseña en Google",
  instagram: "Comentario en Instagram",
  cliente: "Opinión de cliente",
} as const;

export const ReviewCardScene: React.FC<{ scene: SceneOf<"review_card"> }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = useTheme();
  const review = t.brand.reviews[scene.reviewIndex];
  if (!review) throw new Error(`review_card: no review at index ${scene.reviewIndex}`);
  const cardIn = spring({ frame, fps, config: { damping: 16, stiffness: 120 } });

  return (
    <AbsoluteFill>
      <Backdrop mood="calido" background={scene.background} durationInFrames={scene.durationInFrames} seed={`${t.brand.name}-${scene.type}`} dim={0.45} />
      <div
        style={{
          position: "absolute",
          top: 360,
          left: 100,
          width: 880,
          padding: "60px 60px 54px",
          borderRadius: 48,
          backgroundColor: "#FFFFFF",
          boxShadow: "0 40px 90px rgba(0,0,0,0.5)",
          opacity: cardIn,
          transform: `translateY(${(1 - cardIn) * 160}px) rotate(${(1 - cardIn) * -3}deg)`,
        }}
      >
        <div style={{ display: "flex", gap: 10, marginBottom: 26 }}>
          {[0, 1, 2, 3, 4].map((i) => {
            const pop = spring({ frame: frame - BEATS.reviewStar(i), fps, config: { damping: 9, stiffness: 260 } });
            return (
              <div key={i} style={{ transform: `scale(${pop})` }}>
                <StarIcon size={88} color={i < review.rating ? "#FFB400" : "#DDDDDD"} />
              </div>
            );
          })}
        </div>
        <UiText text={`“${review.text}”`} maxWidth={760} maxSize={70} weight={800} maxLines={4} color="#141414" />
        <div style={{ display: "flex", alignItems: "center", gap: 20, marginTop: 36 }}>
          <div
            style={{
              width: 76,
              height: 76,
              borderRadius: "50%",
              backgroundColor: t.primary,
              color: readableOn(t.primary),
              fontFamily: `"${UI_FONT}"`,
              fontWeight: 900,
              fontSize: 38,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {review.author.slice(0, 1).toUpperCase()}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <UiText text={review.author} maxWidth={560} maxSize={40} weight={800} maxLines={1} color="#141414" />
            <UiText text={SOURCE_LABEL[review.source]} maxWidth={560} maxSize={30} weight={600} maxLines={1} color="#6B6B6B" />
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
