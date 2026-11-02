import type { BrandKit } from "./brand";
import { FPS, totalFrames, voiceoverText, type SceneType, type TemplateId, type VideoSpec } from "./spec";
import { naturalSpeechMs } from "./timing";

export interface TemplateRule {
  label: string;
  /** Allowed total duration in seconds. */
  durationSec: [min: number, max: number];
  /** Scene types allowed as the first scene (the hook). */
  firstScene: SceneType[];
  /** Scene types that must appear at least `count` times. */
  requires: { type: SceneType; count: number }[];
  /** Scene types this template never uses. */
  forbids: SceneType[];
}

export const TEMPLATE_RULES: Record<TemplateId, TemplateRule> = {
  thumbstopper: {
    label: "Thumb-stopper cinematográfico",
    durationSec: [10, 18],
    firstScene: ["broll", "product_hero"],
    requires: [
      { type: "product_hero", count: 1 },
      { type: "cta", count: 1 },
    ],
    forbids: ["bullets", "review_card"],
  },
  pas: {
    label: "Problema → Agitación → Solución",
    durationSec: [16, 30],
    firstScene: ["text_punch"],
    requires: [
      { type: "text_punch", count: 1 },
      { type: "product_hero", count: 1 },
      { type: "cta", count: 1 },
    ],
    forbids: ["deadline"],
  },
  showcase: {
    label: "Showcase / catálogo dinámico",
    durationSec: [10, 22],
    firstScene: ["text_punch", "broll", "product_flash"],
    requires: [
      { type: "product_flash", count: 4 },
      { type: "cta", count: 1 },
    ],
    forbids: ["review_card", "bullets"],
  },
  autoridad: {
    label: "Autoridad y prueba social",
    durationSec: [16, 30],
    firstScene: ["text_punch", "broll"],
    requires: [
      { type: "bullets", count: 1 },
      { type: "cta", count: 1 },
    ],
    forbids: ["deadline", "product_flash"],
  },
  oferta: {
    label: "Oferta relámpago",
    durationSec: [8, 16],
    firstScene: ["text_punch", "price_card", "product_hero"],
    requires: [
      { type: "price_card", count: 1 },
      { type: "cta", count: 1 },
    ],
    forbids: ["review_card", "bullets"],
  },
};

export interface SpecIssue {
  specId: string;
  message: string;
}

/**
 * Checks a spec against its template rules and against the brand's real data.
 * The second part is what keeps the director honest: no unknown products, no
 * prices or discounts the owner did not give us, no reviews that do not exist.
 */
export function validateSpec(spec: VideoSpec, brand: BrandKit): SpecIssue[] {
  const issues: SpecIssue[] = [];
  const add = (message: string) => issues.push({ specId: spec.id, message });
  const rule = TEMPLATE_RULES[spec.template];

  const seconds = totalFrames(spec) / FPS;
  const [minS, maxS] = rule.durationSec;
  if (seconds < minS || seconds > maxS) {
    add(`duration ${seconds.toFixed(1)}s outside ${minS}-${maxS}s for ${spec.template}`);
  }

  const first = spec.scenes[0];
  if (first && !rule.firstScene.includes(first.type)) {
    add(`first scene "${first.type}" not allowed; use one of ${rule.firstScene.join(", ")}`);
  }
  const last = spec.scenes.at(-1);
  if (last?.type !== "cta") add("last scene must be a cta");

  for (const req of rule.requires) {
    const n = spec.scenes.filter((s) => s.type === req.type).length;
    if (n < req.count) add(`needs at least ${req.count} "${req.type}" scene(s), has ${n}`);
  }
  for (const s of spec.scenes) {
    if (rule.forbids.includes(s.type)) add(`scene type "${s.type}" not allowed in ${spec.template}`);
  }

  const products = new Map(brand.products.map((p) => [p.id, p]));
  for (const s of spec.scenes) {
    if ("productId" in s && s.productId !== undefined && !products.has(s.productId)) {
      add(`unknown productId "${s.productId}"`);
    }
    if (s.type === "product_flash" && s.showPrice && products.get(s.productId)?.price === undefined) {
      add(`product "${s.productId}" has no price; set showPrice false`);
    }
    if (s.type === "price_card") {
      const product = s.productId ? products.get(s.productId) : undefined;
      const known = new Set<number>(brand.products.flatMap((p) => (p.price ? [p.price] : [])));
      if (product?.price !== undefined ? s.price !== product.price : !known.has(s.price)) {
        add(`price ${s.price} does not match any price provided by the owner`);
      }
      if (s.oldPrice !== undefined && (product?.oldPrice === undefined || s.oldPrice !== product.oldPrice)) {
        add(`oldPrice ${s.oldPrice} was not provided by the owner`);
      }
    }
    if (s.type === "review_card" && !brand.reviews[s.reviewIndex]) {
      add(`reviewIndex ${s.reviewIndex} does not exist (brand has ${brand.reviews.length} reviews)`);
    }
    if (s.type === "deadline" && !brand.offer?.deadline) {
      add("deadline scene used but the owner gave no real deadline");
    }
  }

  spec.scenes.forEach((s, i) => {
    if (!s.say) return;
    const neededMs = naturalSpeechMs(s.say) + 300;
    const hasMs = (s.durationInFrames / FPS) * 1000;
    // 15% tolerance: estimates are approximate and TTS can speak a little faster.
    if (neededMs > hasMs * 1.15) {
      add(`scene ${i} (${s.type}): "say" needs ~${(neededMs / 1000).toFixed(1)}s but the scene lasts ${(hasMs / 1000).toFixed(1)}s`);
    }
  });
  if (!spec.scenes.some((s) => s.say)) add("the video has no voice-over (no scene has \"say\")");

  const durationMs = (totalFrames(spec) / FPS) * 1000;
  for (const w of spec.voice.words) {
    if (w.endMs < w.startMs) add(`word "${w.text}" ends before it starts`);
    if (w.endMs > durationMs + 50) add(`word "${w.text}" ends after the video (${Math.round(durationMs)}ms)`);
  }
  return issues;
}

/** First ~6 words of the voice-over, normalized. Used to make sure the 5 hooks differ. */
export const hookKey = (spec: VideoSpec): string =>
  voiceoverText(spec)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9ñ ]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 6)
    .join(" ");

/** Validates the whole pack: 5 specs, one per template, distinct hooks, each spec valid. */
export function validatePack(specs: VideoSpec[], brand: BrandKit): SpecIssue[] {
  const issues = specs.flatMap((s) => validateSpec(s, brand));
  const templates = new Set(specs.map((s) => s.template));
  if (specs.length !== 5 || templates.size !== 5) {
    issues.push({ specId: "pack", message: "a pack has exactly 5 videos, one per template" });
  }
  const ids = new Set(specs.map((s) => s.id));
  if (ids.size !== specs.length) issues.push({ specId: "pack", message: "spec ids must be unique" });
  const hooks = new Map<string, string>();
  for (const s of specs) {
    const key = hookKey(s);
    const other = hooks.get(key);
    if (other) issues.push({ specId: s.id, message: `same opening as ${other}: "${key}"` });
    hooks.set(key, s.id);
  }
  return issues;
}
