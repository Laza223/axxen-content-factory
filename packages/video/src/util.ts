import { staticFile } from "remotion";

/** https/data/blob URLs pass through; anything else is a path inside public/. */
export const resolveSrc = (src: string): string =>
  /^(https?:|data:|blob:)/.test(src) ? src : staticFile(src);

const hexToRgb = (hex: string): [number, number, number] => {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};

export const withAlpha = (hex: string, alpha: number): string => {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

export const mix = (a: string, b: string, t: number): string => {
  const ca = hexToRgb(a);
  const cb = hexToRgb(b);
  const c = ca.map((v, i) => Math.round(v + (cb[i]! - v) * t));
  return `#${c.map((v) => v.toString(16).padStart(2, "0")).join("")}`;
};

/** WCAG relative luminance. */
export const luminance = (hex: string): number => {
  const [r, g, b] = hexToRgb(hex).map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  }) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

/** Near-black or white, whichever reads better on `bg`. */
export const readableOn = (bg: string): string => (luminance(bg) > 0.4 ? "#111111" : "#FFFFFF");
