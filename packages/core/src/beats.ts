import type { Scene, SceneOf } from "./spec";

/**
 * Animation beats, in frames from the start of a scene. Scene components animate on
 * these frames and the SFX planner drops sounds on the same frames, so a "pop" lands
 * exactly when the sticker pops. Change a number here and both stay in sync.
 */
export const BEATS = {
  textPunchLine: (line: number) => 3 + line * 5,
  heroSweep: 14,
  flashSticker: 3,
  priceStrike: 4,
  priceCountFrom: 8,
  priceLand: 26,
  reviewStar: (star: number) => 8 + star * 3,
  bulletsItem: (scene: SceneOf<"bullets">, item: number) =>
    Math.round(8 + item * ((scene.durationInFrames * 0.55) / scene.items.length)),
  deadlinePill: 8,
  ctaLogo: 0,
  ctaButton: 12,
} as const;

export type BeatKind =
  | "cut" | "slam" | "reveal" | "sweep" | "pop" | "price" | "star" | "item" | "tick" | "button";

export interface Beat {
  /** Frame relative to the scene start. */
  frame: number;
  kind: BeatKind;
}

/** Every beat of a scene, in order. Cuts are added by the planner, not here. */
export function sceneBeats(scene: Scene): Beat[] {
  switch (scene.type) {
    case "text_punch":
      return scene.lines.map((_, i) => ({ frame: BEATS.textPunchLine(i), kind: "slam" as const }));
    case "product_hero":
      return [
        { frame: 0, kind: "reveal" },
        { frame: BEATS.heroSweep, kind: "sweep" },
      ];
    case "product_flash":
      return scene.showPrice ? [{ frame: BEATS.flashSticker, kind: "pop" }] : [];
    case "price_card":
      return [{ frame: BEATS.priceLand, kind: "price" }];
    case "review_card":
      return [{ frame: BEATS.reviewStar(0), kind: "star" }];
    case "bullets":
      return scene.items.map((_, i) => ({ frame: BEATS.bulletsItem(scene, i), kind: "item" as const }));
    case "deadline":
      return [{ frame: 0, kind: "tick" }];
    case "cta":
      return [{ frame: BEATS.ctaButton, kind: "button" }];
    case "broll":
      return [];
  }
}
