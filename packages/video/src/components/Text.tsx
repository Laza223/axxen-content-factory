import type React from "react";
import { UI_FONT, UI_WIDTH_EM, fitFontSize } from "../fonts";
import { useTheme } from "../theme";

interface DisplayTextProps {
  text: string;
  maxWidth: number;
  maxSize: number;
  maxLines?: number;
  color?: string;
  shadow?: boolean;
  style?: React.CSSProperties;
}

/** Headline in the brand's display font, auto-sized so the longest allowed text still fits. */
export const DisplayText: React.FC<DisplayTextProps> = ({ text, maxWidth, maxSize, maxLines = 2, color, shadow = true, style }) => {
  const t = useTheme();
  const f = t.display;
  const shown = f.uppercase ? text.toUpperCase() : text;
  const { fontSize } = fitFontSize(shown, { maxWidth, maxSize, widthEm: f.widthEm, maxLines });
  return (
    <div
      style={{
        width: maxWidth,
        fontFamily: `"${f.family}"`,
        fontWeight: f.weight,
        fontSize,
        lineHeight: f.lineHeight,
        letterSpacing: f.letterSpacing,
        color: color ?? t.text,
        textAlign: "center",
        textWrap: "balance",
        overflowWrap: "break-word",
        textShadow: shadow ? "0 6px 24px rgba(0,0,0,0.45)" : undefined,
        ...style,
      }}
    >
      {shown}
    </div>
  );
};

interface UiTextProps {
  text: string;
  maxWidth: number;
  maxSize: number;
  weight?: 600 | 800 | 900;
  maxLines?: number;
  color?: string;
  style?: React.CSSProperties;
}

/** Sans text for prices, labels and body copy. */
export const UiText: React.FC<UiTextProps> = ({ text, maxWidth, maxSize, weight = 800, maxLines = 2, color, style }) => {
  const t = useTheme();
  const { fontSize } = fitFontSize(text, { maxWidth, maxSize, widthEm: UI_WIDTH_EM[weight], maxLines, minSize: 20 });
  return (
    <div
      style={{
        maxWidth,
        fontFamily: `"${UI_FONT}"`,
        fontWeight: weight,
        fontSize,
        lineHeight: 1.12,
        color: color ?? t.text,
        textWrap: "balance",
        ...style,
      }}
    >
      {text}
    </div>
  );
};
