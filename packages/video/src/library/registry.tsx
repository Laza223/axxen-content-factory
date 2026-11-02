import type React from "react";
import { BrandAurora } from "./backgrounds/BrandAurora";
import { SpeedBurst } from "./backgrounds/SpeedBurst";
import { SpotlightPodium } from "./backgrounds/SpotlightPodium";
import type { BackgroundProps } from "./types";

/** id → component. Add new library backgrounds here and in ./catalog.ts. */
export const BACKGROUND_COMPONENTS: Record<string, React.FC<BackgroundProps>> = {
  "brand-aurora": BrandAurora,
  "spotlight-podium": SpotlightPodium,
  "speed-burst": SpeedBurst,
};

export const DEFAULT_BACKGROUND_ID = "brand-aurora";
