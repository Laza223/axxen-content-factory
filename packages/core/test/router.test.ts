import { describe, expect, it } from "vitest";
import { EMPTY_LIBRARY, SFX_MIN_GAP, planSfx, routeAssets, routePack, sceneStarts, BEATS } from "../src";
import { brand, library, spec } from "./fixtures";

const bgId = (s: ReturnType<typeof spec>, i: number) => {
  const scene = s.scenes[i] as { background?: { kind: string; id?: string } };
  return scene.background?.kind === "component" ? scene.background.id : undefined;
};

describe("routeAssets", () => {
  it("leaves the spec alone with an empty library", () => {
    const s = spec();
    expect(routeAssets(s, brand, EMPTY_LIBRARY, "seed")).toEqual(s);
  });

  it("respects text/product safety and rubro", () => {
    const out = routeAssets(spec(), brand, library, "seed");
    const textBg = library.backgrounds.find((b) => b.id === bgId(out, 0))!;
    const productBg = library.backgrounds.find((b) => b.id === bgId(out, 1))!;
    expect(textBg.textSafe).toBe(true);
    expect(productBg.productSafe).toBe(true);
    expect(out.scenes.map((_, i) => bgId(out, i))).not.toContain("beauty-only");
    expect(bgId(out, 3)).toBeUndefined(); // cta has no background
  });

  it("prefers the template's energy and is deterministic", () => {
    const a = routeAssets(spec(), brand, library, "seed");
    const b = routeAssets(spec(), brand, library, "seed");
    expect(a).toEqual(b);
    expect(bgId(a, 0)).toBe("hot-text"); // thumbstopper wants energy 2–3 and fuego
  });

  it("keeps product stages for scenes that show a product", () => {
    const s = spec({
      template: "autoridad",
      scenes: [
        { type: "review_card", durationInFrames: 120, reviewIndex: 0, say: "Mirá." },
        { type: "cta", durationInFrames: 90, headline: "Pedí", say: "Escribinos." },
      ],
    });
    expect(bgId(routeAssets(s, brand, library, "seed"), 0)).not.toBe("podium");
  });

  it("avoids repeating a background in adjacent scenes", () => {
    const s = spec({
      scenes: [
        { type: "text_punch", durationInFrames: 60, lines: ["A"], say: "A." },
        { type: "text_punch", durationInFrames: 60, lines: ["B"], say: "B." },
        { type: "cta", durationInFrames: 90, headline: "Pedí", say: "Escribinos." },
      ],
    });
    const out = routeAssets(s, brand, library, "seed");
    expect(bgId(out, 0)).not.toBe(bgId(out, 1));
  });

  it("picks music by mood and spreads tracks across a pack", () => {
    const pack = routePack([spec({ id: "a" }), spec({ id: "b" })], brand, library, "seed");
    expect(pack[0]!.music?.src).toBe("music/hot.mp3");
    expect(pack[1]!.music?.src).toBe("music/calm.mp3");
  });
});

describe("planSfx", () => {
  it("adds nothing without a library", () => {
    expect(planSfx(spec(), brand, EMPTY_LIBRARY, "seed").sfx).toEqual([]);
  });

  it("lands the cash sound exactly on the price beat", () => {
    const s = spec();
    const out = planSfx(s, brand, library, "seed");
    const priceFrame = sceneStarts(s)[2]! + BEATS.priceLand;
    const cue = out.sfx.find((c) => c.frame === priceFrame);
    expect(cue?.src).toBe("sfx/cash-1.mp3"); // thumbstopper caps intensity at 2
  });

  it("keeps cues apart and skips categories the library lacks", () => {
    const out = planSfx(spec(), brand, library, "seed");
    const frames = out.sfx.map((c) => c.frame);
    for (let i = 1; i < frames.length; i++) expect(frames[i]! - frames[i - 1]!).toBeGreaterThanOrEqual(SFX_MIN_GAP);
    expect(out.sfx.some((c) => c.src.includes("sparkle"))).toBe(false); // estética-only sound
    expect(out.sfx.some((c) => c.src.includes("impact"))).toBe(true);
  });

  it("uses louder sounds in aggressive templates", () => {
    const out = planSfx(spec({ template: "oferta" }), brand, library, "seed");
    expect(out.sfx.some((c) => c.src === "sfx/cash-loud.mp3")).toBe(true);
  });
});
