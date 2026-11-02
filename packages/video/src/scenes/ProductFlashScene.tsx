import { BEATS, formatARS, type SceneOf } from "@axxen/core";
import type React from "react";
import { AbsoluteFill, Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { UI_FONT } from "../fonts";
import { ProductImage } from "../components/ProductImage";
import { DisplayText, UiText } from "../components/Text";
import { useTheme } from "../theme";
import { readableOn, withAlpha } from "../util";

export const ProductFlashScene: React.FC<{ scene: SceneOf<"product_flash">; index: number }> = ({ scene, index }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = useTheme();
  const product = t.brand.products.find((p) => p.id === scene.productId);
  if (!product) throw new Error(`product_flash: unknown product ${scene.productId}`);

  const palette = [t.primary, t.secondary, t.accent];
  const bg = palette[index % palette.length]!;
  const fg = readableOn(bg);
  const stickerBg = bg === t.accent ? t.primary : t.accent;
  const punch = interpolate(frame, [0, 6], [1.22, 1], { extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  const sticker = spring({ frame: frame - BEATS.flashSticker, fps, config: { damping: 9, stiffness: 260 } });
  const marquee = (frame * 14 + index * 300) % 1400;
  const name = t.display.uppercase ? product.name.toUpperCase() : product.name;

  return (
    <AbsoluteFill style={{ backgroundColor: bg, overflow: "hidden" }}>
      {[0, 1, 2].map((row) => (
        <div
          key={row}
          style={{
            position: "absolute",
            top: 330 + row * 300,
            left: -marquee * (row % 2 ? -1 : 1) - 400,
            whiteSpace: "nowrap",
            fontFamily: `"${t.display.family}"`,
            fontWeight: t.display.weight,
            fontSize: 260,
            lineHeight: 1,
            color: "transparent",
            WebkitTextStroke: `3px ${withAlpha(fg === "#FFFFFF" ? "#FFFFFF" : "#111111", 0.16)}`,
          }}
        >
          {`${name} · ${name} · ${name} · ${name}`}
        </div>
      ))}
      <div style={{ position: "absolute", top: 250, left: 100, width: 880 }}>
        <DisplayText text={scene.label ?? product.name} maxWidth={880} maxSize={96} maxLines={1} color={fg} shadow={fg === "#FFFFFF"} />
      </div>
      <div style={{ position: "absolute", top: 400, left: 130, transform: `scale(${punch})` }}>
        <ProductImage product={product} width={820} height={680} />
      </div>
      {scene.showPrice && product.price !== undefined ? (
        <div
          style={{
            position: "absolute",
            top: 860,
            left: 650,
            width: 280,
            height: 280,
            borderRadius: "50%",
            backgroundColor: stickerBg,
            boxShadow: "0 18px 40px rgba(0,0,0,0.35)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transform: `rotate(-10deg) scale(${sticker})`,
          }}
        >
          <UiText text={formatARS(product.price)} maxWidth={230} maxSize={76} weight={900} maxLines={1} color={readableOn(stickerBg)} style={{ fontFamily: `"${UI_FONT}"` }} />
        </div>
      ) : null}
    </AbsoluteFill>
  );
};
