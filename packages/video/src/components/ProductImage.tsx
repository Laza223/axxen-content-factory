import type { Product } from "@axxen/core";
import type React from "react";
import { Img, interpolate, useCurrentFrame } from "remotion";
import { resolveSrc } from "../util";

interface Props {
  product: Product;
  width: number;
  height: number;
  /** Frame (relative to the scene) when the light sweep crosses the product. */
  sweepAt?: number;
  style?: React.CSSProperties;
}

/**
 * The client's real product photo. Never generated or altered: we only move it, light it
 * and shadow it. Cut-outs float with a drop shadow; full photos sit on a rounded card.
 */
export const ProductImage: React.FC<Props> = ({ product, width, height, sweepAt, style }) => {
  const frame = useCurrentFrame();
  const src = resolveSrc(product.image);
  const sweep =
    sweepAt === undefined ? null : interpolate(frame - sweepAt, [0, 22], [-40, 140], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const sweepLayer =
    sweep === null || sweep >= 140 || sweep <= -40 ? null : (
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `linear-gradient(110deg, transparent ${sweep - 18}%, rgba(255,255,255,0.55) ${sweep}%, transparent ${sweep + 18}%)`,
          mixBlendMode: "screen",
          ...(product.cutout
            ? {
                WebkitMaskImage: `url("${src}")`,
                WebkitMaskSize: "contain",
                WebkitMaskRepeat: "no-repeat",
                WebkitMaskPosition: "center",
              }
            : {}),
        }}
      />
    );

  if (product.cutout) {
    return (
      <div style={{ position: "relative", width, height, ...style }}>
        <Img
          src={src}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
            filter: "drop-shadow(0 40px 50px rgba(0,0,0,0.55)) drop-shadow(0 8px 14px rgba(0,0,0,0.35))",
          }}
        />
        {sweepLayer}
      </div>
    );
  }
  return (
    <div
      style={{
        position: "relative",
        width,
        height,
        borderRadius: 44,
        overflow: "hidden",
        boxShadow: "0 40px 80px rgba(0,0,0,0.55)",
        border: "6px solid rgba(255,255,255,0.9)",
        ...style,
      }}
    >
      <Img src={src} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      {sweepLayer}
    </div>
  );
};
