import type { FontKey } from "@axxen/core";
import { loadFont } from "@remotion/fonts";
import { staticFile } from "remotion";

export interface DisplayFont {
  family: string;
  weight: number;
  uppercase: boolean;
  /** Widest measured average advance per character, in em (Chromium, sample headlines). */
  widthEm: number;
  letterSpacing: string;
  /** Line height that looks right for this face in tight headline blocks. */
  lineHeight: number;
}

export const DISPLAY_FONTS: Record<FontKey, DisplayFont & { file: string }> = {
  anton: { family: "Anton", file: "anton-latin-400-normal.woff2", weight: 400, uppercase: true, widthEm: 0.455, letterSpacing: "0.01em", lineHeight: 1.02 },
  bebas: { family: "Bebas Neue", file: "bebas-neue-latin-400-normal.woff2", weight: 400, uppercase: true, widthEm: 0.376, letterSpacing: "0.02em", lineHeight: 0.95 },
  "archivo-black": { family: "Archivo Black", file: "archivo-black-latin-400-normal.woff2", weight: 400, uppercase: true, widthEm: 0.724, letterSpacing: "-0.01em", lineHeight: 1.0 },
  montserrat: { family: "Montserrat", file: "montserrat-latin-900-normal.woff2", weight: 900, uppercase: true, widthEm: 0.704, letterSpacing: "-0.01em", lineHeight: 1.0 },
  poppins: { family: "Poppins", file: "poppins-latin-800-normal.woff2", weight: 800, uppercase: true, widthEm: 0.627, letterSpacing: "-0.01em", lineHeight: 1.02 },
  oswald: { family: "Oswald", file: "oswald-latin-700-normal.woff2", weight: 700, uppercase: true, widthEm: 0.512, letterSpacing: "0", lineHeight: 1.05 },
  playfair: { family: "Playfair Display", file: "playfair-display-latin-800-normal.woff2", weight: 800, uppercase: false, widthEm: 0.629, letterSpacing: "-0.01em", lineHeight: 1.05 },
  "dm-serif": { family: "DM Serif Display", file: "dm-serif-display-latin-400-normal.woff2", weight: 400, uppercase: false, widthEm: 0.558, letterSpacing: "0", lineHeight: 1.05 },
};

/** Sans used for prices, labels, captions in "clean" style and small UI text. */
export const UI_FONT = "Montserrat";
export const UI_WIDTH_EM = { 600: 0.66, 800: 0.695, 900: 0.704 } as const;

const UI_FILES: [file: string, weight: number][] = [
  ["montserrat-latin-600-normal.woff2", 600],
  ["montserrat-latin-800-normal.woff2", 800],
  ["montserrat-latin-900-normal.woff2", 900],
];

let loaded: Promise<unknown> | null = null;

/** Loads every curated font once. Files are local (public/fonts), so renders never hit the network. */
export function loadAllFonts(): Promise<unknown> {
  loaded ??= Promise.all([
    ...Object.values(DISPLAY_FONTS).map((f) =>
      loadFont({ family: f.family, url: staticFile(`fonts/${f.file}`), weight: String(f.weight) }),
    ),
    ...UI_FILES.map(([file, weight]) =>
      loadFont({ family: UI_FONT, url: staticFile(`fonts/${file}`), weight: String(weight) }),
    ),
  ]);
  return loaded;
}

/**
 * Picks the largest font size (≤ maxSize) at which `text` fits `maxWidth` in at most
 * `maxLines` lines. Uses measured per-font character widths plus a wrapping margin,
 * so the result is deterministic (no DOM measuring during render).
 */
export function fitFontSize(
  text: string,
  opts: { maxWidth: number; maxSize: number; minSize?: number; widthEm: number; maxLines?: number },
): { fontSize: number; lines: number } {
  const { maxWidth, maxSize, minSize = 24, widthEm, maxLines = 2 } = opts;
  const chars = Math.max(text.length, 1);
  let best = { fontSize: minSize, lines: maxLines };
  for (let lines = 1; lines <= maxLines; lines++) {
    // Word wrapping never splits perfectly evenly: leave 18% slack per extra line.
    const perLine = Math.ceil(chars / lines) * (lines > 1 ? 1.18 : 1);
    const size = Math.floor(maxWidth / (perLine * widthEm * 1.06));
    const clamped = Math.max(minSize, Math.min(maxSize, size));
    if (clamped >= maxSize * 0.72 || lines === maxLines) {
      best = { fontSize: clamped, lines };
      break;
    }
  }
  return best;
}
