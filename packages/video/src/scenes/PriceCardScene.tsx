import { BEATS, discountPercent, formatARS, type SceneOf } from "@axxen/core";
import type React from "react";
import { AbsoluteFill, Easing, interpolate, random, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { Backdrop } from "../components/Backdrop";
import { ProductImage } from "../components/ProductImage";
import { DisplayText, UiText } from "../components/Text";
import { useTheme } from "../theme";

export const PriceCardScene: React.FC<{ scene: SceneOf<"price_card"> }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = useTheme();
  const product = scene.productId ? t.brand.products.find((p) => p.id === scene.productId) : undefined;

  const cardTop = product ? 640 : 400;
  const cardIn = spring({ frame, fps, config: { damping: 15, stiffness: 140 } });
  const productIn = spring({ frame: frame - 2, fps, config: { damping: 13 } });
  const from = scene.oldPrice ?? Math.round(scene.price * 1.25);
  const counted = interpolate(frame, [BEATS.priceCountFrom, BEATS.priceLand], [from, scene.price], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  const shown = Math.round(counted / 10) * 10;
  const landed = frame >= BEATS.priceLand;
  const strike = interpolate(frame, [BEATS.priceStrike, BEATS.priceStrike + 8], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const badge = spring({ frame: frame - BEATS.priceLand, fps, config: { damping: 8, stiffness: 240 } });
  const shake = t.style.shake && frame >= BEATS.priceLand && frame < BEATS.priceLand + 10 ? (random(`sx${frame}`) - 0.5) * 22 : 0;
  const off = scene.oldPrice ? discountPercent(scene.price, scene.oldPrice) : 0;

  return (
    <AbsoluteFill style={{ transform: `translate(${shake}px, ${shake * 0.6}px)` }}>
      <Backdrop mood="energia" background={scene.background} durationInFrames={scene.durationInFrames} seed={`${t.brand.name}-${scene.type}`} dim={0.4} />
      {product ? (
        <div style={{ position: "absolute", top: 250, left: (1080 - 460) / 2, transform: `translateY(${(1 - productIn) * 200}px)`, opacity: productIn }}>
          <ProductImage product={product} width={460} height={390} sweepAt={20} />
        </div>
      ) : null}
      <div
        style={{
          position: "absolute",
          top: cardTop,
          left: 100,
          width: 880,
          padding: "32px 40px 36px",
          borderRadius: 48,
          backgroundColor: t.primary,
          color: t.onPrimary,
          boxShadow: "0 40px 90px rgba(0,0,0,0.5)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 10,
          transform: `translateY(${(1 - cardIn) * 500}px)`,
        }}
      >
        <DisplayText text={scene.headline} maxWidth={800} maxSize={70} maxLines={2} color={t.onPrimary} shadow={false} />
        {scene.oldPrice ? (
          <div style={{ position: "relative", opacity: 0.8 }}>
            <UiText text={formatARS(scene.oldPrice)} maxWidth={500} maxSize={60} weight={800} maxLines={1} color={t.onPrimary} />
            <div
              style={{
                position: "absolute",
                left: -8,
                right: -8,
                top: "52%",
                height: 8,
                borderRadius: 4,
                backgroundColor: t.onPrimary,
                transform: `rotate(-8deg) scaleX(${strike})`,
                transformOrigin: "left center",
              }}
            />
          </div>
        ) : null}
        <UiText
          text={formatARS(shown)}
          maxWidth={800}
          maxSize={164}
          weight={900}
          maxLines={1}
          color={t.onPrimary}
          style={{ letterSpacing: "-0.03em", transform: `scale(${landed ? 1 : 0.94})` }}
        />
        {scene.installments ? (
          <div style={{ marginTop: 8, padding: "14px 34px", borderRadius: 999, backgroundColor: t.accent }}>
            <UiText text={scene.installments} maxWidth={700} maxSize={42} weight={800} maxLines={1} color={t.onAccent} />
          </div>
        ) : null}
      </div>
      {off > 0 ? (
        <div
          style={{
            position: "absolute",
            // Sticker on the product's shoulder; above the card when there is no product.
            top: product ? 300 : cardTop - 240,
            left: product ? 720 : 760,
            width: 210,
            height: 210,
            borderRadius: "50%",
            backgroundColor: t.accent,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 16px 40px rgba(0,0,0,0.4)",
            transform: `rotate(12deg) scale(${badge})`,
          }}
        >
          <UiText text={`-${off}%`} maxWidth={180} maxSize={70} weight={900} maxLines={1} color={t.onAccent} />
        </div>
      ) : null}
    </AbsoluteFill>
  );
};
