import type { Word } from "@axxen/core";
import { createTikTokStyleCaptions, type TikTokPage } from "@remotion/captions";
import type React from "react";
import { useMemo } from "react";
import { spring, useCurrentFrame, useVideoConfig } from "remotion";
import { SAFE_ZONE } from "@axxen/core";
import { UI_FONT, UI_WIDTH_EM, fitFontSize } from "../fonts";
import { useTheme } from "../theme";
import { withAlpha } from "../util";

interface Props {
  words: Word[];
  /** Scene cut times in ms. A caption page never spans a cut. */
  cutsMs: number[];
  style: "bold" | "clean";
  /** Hide while big on-screen text already says the same thing. */
  hidden: boolean;
}

/** Captions block: lower third, inside the Reels safe zone. */
const BLOCK = { top: 1190, width: 880 } as const;

export const Captions: React.FC<Props> = ({ words, cutsMs, style, hidden }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = useTheme();
  const pages = useMemo<TikTokPage[]>(
    () =>
      createTikTokStyleCaptions({
        captions: words.map((w, i) => ({
          text: i === 0 ? w.text : ` ${w.text}`,
          startMs: w.startMs,
          endMs: w.endMs,
          timestampMs: null,
          confidence: null,
          // New page after a sentence ends or before a scene cut.
          pageBreakAfter:
            /[.!?…]$/.test(w.text) ||
            cutsMs.some((cut) => w.endMs <= cut && (words[i + 1]?.startMs ?? Infinity) >= cut),
        })),
        combineTokensWithinMilliseconds: style === "bold" ? 700 : 1200,
      }).pages,
    [words, cutsMs, style],
  );

  const nowMs = (frame / fps) * 1000;
  const page = pages.find((p) => {
    // A page lasts until the next page starts, but never past the next scene cut.
    const nextCut = cutsMs.find((cut) => cut > p.startMs) ?? Infinity;
    const endMs = Math.min(p.startMs + Math.max(p.durationMs, 1), nextCut);
    return nowMs >= p.startMs && nowMs < endMs;
  });
  if (!page || hidden) return null;

  const pageStartFrame = Math.round((page.startMs / 1000) * fps);
  const pop = spring({ frame: frame - pageStartFrame, fps, config: { damping: 14, stiffness: 220 }, durationInFrames: 8 });
  const bold = style === "bold";
  const display = t.display;
  const text = bold && display.uppercase ? page.text.toUpperCase() : page.text;
  const { fontSize } = fitFontSize(text.trim(), {
    maxWidth: BLOCK.width,
    maxSize: bold ? 92 : 64,
    minSize: 40,
    widthEm: bold ? display.widthEm : UI_WIDTH_EM[800],
    maxLines: 2,
  });

  return (
    <div
      style={{
        position: "absolute",
        top: BLOCK.top,
        left: SAFE_ZONE.left + (1080 - SAFE_ZONE.left - SAFE_ZONE.right - BLOCK.width) / 2,
        width: BLOCK.width,
        height: 1920 - SAFE_ZONE.bottom - BLOCK.top,
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          transform: `scale(${0.86 + 0.14 * pop})`,
          textAlign: "center",
          fontFamily: bold ? `"${display.family}"` : `"${UI_FONT}"`,
          fontWeight: bold ? display.weight : 800,
          fontSize,
          lineHeight: 1.08,
          letterSpacing: bold ? display.letterSpacing : 0,
          padding: bold ? 0 : "14px 26px",
          borderRadius: 22,
          backgroundColor: bold ? undefined : "rgba(0,0,0,0.62)",
        }}
      >
        {page.tokens.map((tok, i) => {
          const active = nowMs >= tok.fromMs && nowMs < tok.toMs;
          const tokText = bold && display.uppercase ? tok.text.toUpperCase() : tok.text;
          return (
            <span
              key={i}
              style={{
                whiteSpace: "pre",
                color: active ? (bold ? t.accent : t.onAccent) : "#FFFFFF",
                backgroundColor: !bold && active ? t.accent : undefined,
                borderRadius: 10,
                WebkitTextStroke: bold ? `${Math.round(fontSize / 9)}px #000` : undefined,
                paintOrder: "stroke fill",
                textShadow: bold ? `0 6px 0 ${withAlpha("#000000", 0.5)}` : undefined,
              }}
            >
              {tokText}
            </span>
          );
        })}
      </div>
    </div>
  );
};
