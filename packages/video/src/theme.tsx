import type { BrandKit, TemplateId } from "@axxen/core";
import { createContext, useContext } from "react";
import { DISPLAY_FONTS, type DisplayFont } from "./fonts";
import { mix, readableOn } from "./util";

export interface TemplateStyle {
  /** One-frame flash on every cut (fast, aggressive formats). */
  cutFlash: boolean;
  /** Cinematic letterbox bars that open during the first second. */
  letterboxIntro: boolean;
  /** Small camera shake on emphasis (prices, deadlines). */
  shake: boolean;
}

const TEMPLATE_STYLES: Record<TemplateId, TemplateStyle> = {
  thumbstopper: { cutFlash: false, letterboxIntro: true, shake: false },
  pas: { cutFlash: false, letterboxIntro: false, shake: false },
  showcase: { cutFlash: true, letterboxIntro: false, shake: false },
  autoridad: { cutFlash: false, letterboxIntro: false, shake: false },
  oferta: { cutFlash: true, letterboxIntro: false, shake: true },
};

export interface Theme {
  brand: BrandKit;
  primary: string;
  secondary: string;
  accent: string;
  text: string;
  background: string;
  onPrimary: string;
  onAccent: string;
  /** Background a notch darker than the brand background, for depth. */
  deep: string;
  display: DisplayFont;
  template: TemplateId;
  style: TemplateStyle;
}

export function makeTheme(brand: BrandKit, template: TemplateId): Theme {
  const c = brand.colors;
  return {
    brand,
    primary: c.primary,
    secondary: c.secondary,
    accent: c.accent,
    text: c.text,
    background: c.background,
    onPrimary: readableOn(c.primary),
    onAccent: readableOn(c.accent),
    deep: mix(c.background, "#000000", 0.45),
    display: DISPLAY_FONTS[brand.font],
    template,
    style: TEMPLATE_STYLES[template],
  };
}

const ThemeContext = createContext<Theme | null>(null);
export const ThemeProvider = ThemeContext.Provider;

export function useTheme(): Theme {
  const theme = useContext(ThemeContext);
  if (!theme) throw new Error("useTheme must be used inside <ThemeProvider>");
  return theme;
}
