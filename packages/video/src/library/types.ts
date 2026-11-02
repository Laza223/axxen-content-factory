import type { Mood } from "@axxen/core";

/** Brand colors as passed to every background. Never hardcode a palette in a background. */
export interface BackgroundPalette {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  /** `background` darkened; good for gradients' far end. */
  deep: string;
}

/**
 * The only props a library background receives. Backgrounds must be deterministic:
 * derive all randomness from `seed` with remotion's `random()`, never Math.random/Date.
 */
export interface BackgroundProps {
  palette: BackgroundPalette;
  mood: Mood;
  /** Length of the scene it sits behind. Use it to pace slow drifts. */
  durationInFrames: number;
  seed: string;
}
