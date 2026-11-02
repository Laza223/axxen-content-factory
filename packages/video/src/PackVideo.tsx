import type { BrandKit, Scene, VideoSpec } from "@axxen/core";
import type React from "react";
import { useMemo } from "react";
import { AbsoluteFill, Audio, Sequence, Series, useCurrentFrame, useVideoConfig } from "remotion";
import { Captions } from "./components/Captions";
import { CutFlash, LetterboxIntro, LogoBadge, PreviewWatermark } from "./components/Overlays";
import { BrollScene } from "./scenes/BrollScene";
import { BulletsScene } from "./scenes/BulletsScene";
import { CtaScene } from "./scenes/CtaScene";
import { DeadlineScene } from "./scenes/DeadlineScene";
import { PriceCardScene } from "./scenes/PriceCardScene";
import { ProductFlashScene } from "./scenes/ProductFlashScene";
import { ProductHeroScene } from "./scenes/ProductHeroScene";
import { ReviewCardScene } from "./scenes/ReviewCardScene";
import { TextPunchScene } from "./scenes/TextPunchScene";
import { ThemeProvider, makeTheme } from "./theme";
import { resolveSrc } from "./util";

export type PackVideoProps = {
  brand: BrandKit;
  spec: VideoSpec;
  /** Free preview: watermark on, meant for @remotion/player in the browser. */
  preview: boolean;
};

const SceneView: React.FC<{ scene: Scene; index: number }> = ({ scene, index }) => {
  switch (scene.type) {
    case "broll":
      return <BrollScene scene={scene} />;
    case "text_punch":
      return <TextPunchScene scene={scene} />;
    case "product_hero":
      return <ProductHeroScene scene={scene} />;
    case "product_flash":
      return <ProductFlashScene scene={scene} index={index} />;
    case "price_card":
      return <PriceCardScene scene={scene} />;
    case "review_card":
      return <ReviewCardScene scene={scene} />;
    case "bullets":
      return <BulletsScene scene={scene} />;
    case "deadline":
      return <DeadlineScene scene={scene} />;
    case "cta":
      return <CtaScene scene={scene} />;
  }
};

/** Scenes whose big on-screen text already says what the voice says. */
const hidesCaptions = (s: Scene): boolean => s.type === "text_punch" || (s.type === "broll" && !!s.text);
/** Scenes with their own top title, card or big logo, where the corner badge would collide. */
const NO_LOGO_BADGE: Scene["type"][] = ["cta", "product_flash", "bullets", "review_card"];

export const PackVideo: React.FC<PackVideoProps> = ({ brand, spec, preview }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const theme = useMemo(() => makeTheme(brand, spec.template), [brand, spec.template]);

  const timeline = useMemo(() => {
    let start = 0;
    const counters: Partial<Record<Scene["type"], number>> = {};
    return spec.scenes.map((scene) => {
      const index = counters[scene.type] ?? 0;
      counters[scene.type] = index + 1;
      const item = { scene, index, start };
      start += scene.durationInFrames;
      return item;
    });
  }, [spec.scenes]);

  const cutsMs = useMemo(() => timeline.slice(1).map((s) => (s.start / fps) * 1000), [timeline, fps]);
  const current = [...timeline].reverse().find((s) => frame >= s.start)?.scene ?? spec.scenes[0]!;
  const hasVoice = !!spec.voice.src || spec.voice.clips.length > 0;
  const voiceActive = (f: number): boolean => {
    const ms = (f / fps) * 1000;
    return spec.voice.words.some((w) => ms >= w.startMs - 150 && ms <= w.endMs + 250);
  };

  return (
    <ThemeProvider value={theme}>
      <AbsoluteFill style={{ backgroundColor: theme.deep }}>
        <Series>
          {timeline.map(({ scene, index, start }) => (
            <Series.Sequence key={start} durationInFrames={scene.durationInFrames}>
              <SceneView scene={scene} index={index} />
              {theme.style.cutFlash && start > 0 ? <CutFlash color="#FFFFFF" /> : null}
            </Series.Sequence>
          ))}
        </Series>
        {NO_LOGO_BADGE.includes(current.type) ? null : <LogoBadge />}
        <Captions words={spec.voice.words} cutsMs={cutsMs} style={spec.captionStyle} hidden={hidesCaptions(current)} />
        {theme.style.letterboxIntro ? <LetterboxIntro /> : null}
        {preview ? <PreviewWatermark /> : null}
        {spec.voice.src ? (
          <Audio src={resolveSrc(spec.voice.src)} />
        ) : (
          spec.voice.clips.map((clip, i) => (
            <Sequence key={`v${i}`} from={Math.round((clip.startMs / 1000) * fps)} layout="none">
              <Audio src={resolveSrc(clip.src)} />
            </Sequence>
          ))
        )}
        {spec.sfx.map((cue, i) => (
          <Sequence key={`s${i}`} from={cue.frame} layout="none">
            {/* Sequence-relative frame → absolute, so SFX duck under the voice too. */}
            <Audio src={resolveSrc(cue.src)} volume={(f) => (hasVoice && voiceActive(cue.frame + f) ? cue.volume * 0.7 : cue.volume)} />
          </Sequence>
        ))}
        {spec.music ? (
          <Audio
            src={resolveSrc(spec.music.src)}
            loop
            volume={(f) => {
              const base = spec.music?.volume ?? 0.22;
              return hasVoice && voiceActive(f) ? base * 0.35 : base;
            }}
          />
        ) : null}
      </AbsoluteFill>
    </ThemeProvider>
  );
};
