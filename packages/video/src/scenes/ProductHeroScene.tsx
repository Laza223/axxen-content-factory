import { BEATS, type SceneOf } from "@axxen/core";
import type React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { Backdrop } from "../components/Backdrop";
import { ProductImage } from "../components/ProductImage";
import { DisplayText } from "../components/Text";
import { useTheme } from "../theme";
import { withAlpha } from "../util";
import { CONTENT, RUBRO_MOOD } from "./layout";

export const ProductHeroScene: React.FC<{ scene: SceneOf<"product_hero"> }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = useTheme();
  const product = t.brand.products.find((p) => p.id === scene.productId);
  if (!product) throw new Error(`product_hero: unknown product ${scene.productId}`);

  const d = scene.durationInFrames;
  const enter = spring({ frame, fps, config: { damping: 15, stiffness: 110 } });
  let transform: string;
  switch (scene.motion) {
    case "push":
      transform = `scale(${interpolate(frame, [0, d], [0.9, 1.06])})`;
      break;
    case "rise":
      transform = `translateY(${(1 - enter) * 320}px) scale(${0.82 + 0.18 * enter})`;
      break;
    case "orbit":
      transform = `perspective(1400px) rotateY(${interpolate(frame, [0, d], [-14, 14])}deg) translateX(${interpolate(frame, [0, d], [-24, 24])}px)`;
      break;
  }
  const float = Math.sin(frame / 14) * 8;
  const headlineIn = spring({ frame: frame - 10, fps, config: { damping: 16 } });

  return (
    <AbsoluteFill>
      <Backdrop mood={RUBRO_MOOD[t.brand.rubro]} background={scene.background} durationInFrames={scene.durationInFrames} seed={`${t.brand.name}-${scene.type}`} dim={0.35} />
      <div
        style={{
          position: "absolute",
          left: 140,
          width: 800,
          top: 860,
          height: 140,
          borderRadius: "50%",
          background: `radial-gradient(ellipse at center, ${withAlpha(t.accent, 0.45)} 0%, rgba(0,0,0,0) 70%)`,
          opacity: enter,
        }}
      />
      <div
        style={{
          position: "absolute",
          top: CONTENT.top + 10,
          left: (1080 - 800) / 2,
          opacity: Math.min(1, enter * 1.4),
          transform: `${transform} translateY(${float}px)`,
        }}
      >
        <ProductImage product={product} width={800} height={660} sweepAt={BEATS.heroSweep} />
      </div>
      <div
        style={{
          position: "absolute",
          top: 945,
          left: CONTENT.left,
          width: CONTENT.width,
          height: CONTENT.bottom - 945,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          opacity: headlineIn,
          transform: `translateY(${(1 - headlineIn) * 40}px)`,
        }}
      >
        <DisplayText text={scene.headline ?? product.name} maxWidth={CONTENT.width} maxSize={104} maxLines={2} />
      </div>
    </AbsoluteFill>
  );
};
