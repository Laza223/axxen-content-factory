import type { BrandKit } from "@axxen/core";
import { RUBRO_MOOD } from "@axxen/core";
import type React from "react";
import { AbsoluteFill } from "remotion";
import { Backdrop } from "../components/Backdrop";
import { CONTENT } from "../scenes/layout";
import { ThemeProvider, makeTheme } from "../theme";

export type BackgroundPreviewProps = { brand: BrandKit; backgroundId: string };

/** Renders one library background with guides for the product and text safe zones. */
export const BackgroundPreview: React.FC<BackgroundPreviewProps> = ({ brand, backgroundId }) => (
  <ThemeProvider value={makeTheme(brand, "thumbstopper")}>
    <AbsoluteFill>
      <Backdrop mood={RUBRO_MOOD[brand.rubro]} background={{ kind: "component", id: backgroundId }} durationInFrames={90} seed="preview" />
      <div style={{ position: "absolute", top: CONTENT.top, left: 140, width: 800, height: 750, border: "4px dashed rgba(255,255,255,0.35)" }} />
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 220, background: "rgba(255,0,0,0.18)" }} />
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 420, background: "rgba(255,0,0,0.18)" }} />
    </AbsoluteFill>
  </ThemeProvider>
);
