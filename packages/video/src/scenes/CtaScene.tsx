import { BEATS, displayWhatsapp, type SceneOf } from "@axxen/core";
import type React from "react";
import { AbsoluteFill, Img, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { ChatPhoneIcon } from "../components/Icons";
import { DisplayText, UiText } from "../components/Text";
import { useTheme } from "../theme";
import { mix, readableOn, resolveSrc } from "../util";
import { CONTENT } from "./layout";

const WHATSAPP_GREEN = "#1FAF55";

export const CtaScene: React.FC<{ scene: SceneOf<"cta"> }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = useTheme();
  const logoIn = spring({ frame, fps, config: { damping: 11, stiffness: 160 } });
  const textIn = spring({ frame: frame - 6, fps, config: { damping: 15 } });
  const btnIn = spring({ frame: frame - BEATS.ctaButton, fps, config: { damping: 10, stiffness: 180 } });
  const pulse = frame > BEATS.ctaButton + 12 ? 1 + 0.035 * Math.sin((frame - BEATS.ctaButton - 12) / 4.5) : 1;
  const textColor = readableOn(mix(t.primary, t.deep, 0.5));

  return (
    <AbsoluteFill style={{ background: `linear-gradient(165deg, ${t.primary} 0%, ${mix(t.primary, t.deep, 0.7)} 60%, ${t.deep} 100%)` }}>
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
          gap: 44,
        }}
      >
        <div
          style={{
            width: 320,
            height: 320,
            borderRadius: "50%",
            backgroundColor: "#FFFFFF",
            boxShadow: "0 30px 70px rgba(0,0,0,0.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transform: `scale(${logoIn})`,
          }}
        >
          <Img src={resolveSrc(t.brand.logo)} style={{ width: 240, height: 240, objectFit: "contain" }} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14, opacity: textIn, transform: `translateY(${(1 - textIn) * 40}px)` }}>
          <DisplayText text={scene.headline} maxWidth={CONTENT.width} maxSize={124} maxLines={2} color={textColor} />
          {scene.subline ? (
            <UiText text={scene.subline} maxWidth={CONTENT.width} maxSize={42} weight={600} maxLines={2} color={textColor} style={{ textAlign: "center", opacity: 0.9 }} />
          ) : null}
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 24,
            padding: "24px 52px 24px 32px",
            borderRadius: 999,
            backgroundColor: WHATSAPP_GREEN,
            boxShadow: "0 20px 50px rgba(0,0,0,0.45)",
            transform: `scale(${btnIn * pulse})`,
          }}
        >
          <ChatPhoneIcon size={104} color="#FFFFFF" />
          <div style={{ display: "flex", flexDirection: "column" }}>
            <UiText text="Escribinos al WhatsApp" maxWidth={560} maxSize={36} weight={800} maxLines={1} color="#FFFFFF" />
            <UiText text={displayWhatsapp(t.brand.whatsapp)} maxWidth={560} maxSize={66} weight={900} maxLines={1} color="#FFFFFF" />
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
