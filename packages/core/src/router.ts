import type { BrandKit, Rubro } from "./brand";
import { sceneBeats, type BeatKind } from "./beats";
import type { AssetLibrary, BackgroundMeta, SfxCategory, SfxItem } from "./library";
import { seededRandom } from "./rng";
import {
  RUBRO_MOOD,
  SCENES_WITH_BACKGROUND,
  sceneStarts,
  totalFrames,
  type Mood,
  type Scene,
  type TemplateId,
  type VideoSpec,
} from "./spec";

/** Mood a scene is drawn with. Scene components use the same mapping. */
export function sceneMood(scene: Scene, rubro: Rubro): Mood {
  switch (scene.type) {
    case "broll":
      return scene.mood;
    case "price_card":
    case "deadline":
      return "energia";
    case "review_card":
      return "calido";
    default:
      return RUBRO_MOOD[rubro];
  }
}

/** Preferred background/music energy per template (1 calm … 3 frantic). */
const TEMPLATE_ENERGY: Record<TemplateId, [min: number, max: number]> = {
  thumbstopper: [2, 3],
  pas: [1, 2],
  showcase: [2, 3],
  autoridad: [1, 2],
  oferta: [2, 3],
};

const fitsRubro = (rubros: Rubro[], rubro: Rubro) => rubros.length === 0 || rubros.includes(rubro);

function needs(scene: Scene): { text: boolean; product: boolean } {
  switch (scene.type) {
    case "broll":
      return { text: !!scene.text, product: false };
    case "text_punch":
    case "bullets":
    case "deadline":
      return { text: true, product: false };
    case "product_hero":
      return { text: false, product: true };
    case "price_card":
      return { text: false, product: !!scene.productId };
    default:
      return { text: false, product: false };
  }
}

/** Shared across the 5 videos of a pack so the pack does not reuse the same look. */
export interface UsageTracker {
  backgrounds: Map<string, number>;
  music: Set<string>;
}
export const newUsageTracker = (): UsageTracker => ({ backgrounds: new Map(), music: new Set() });

function pickBackground(
  scene: Scene,
  sceneIndex: number,
  spec: VideoSpec,
  brand: BrandKit,
  library: AssetLibrary,
  previousId: string | undefined,
  usedInVideo: Map<string, number>,
  usage: UsageTracker,
  seed: string,
): BackgroundMeta | undefined {
  const mood = sceneMood(scene, brand.rubro);
  const need = needs(scene);
  const [eMin, eMax] = TEMPLATE_ENERGY[spec.template];
  const candidates = library.backgrounds.filter(
    (b) =>
      fitsRubro(b.rubros, brand.rubro) &&
      (!need.text || b.textSafe) &&
      (!need.product || b.productSafe) &&
      // A product stage (podium, spotlight) looks empty without a product on it.
      (!b.stage || need.product),
  );
  if (candidates.length === 0) return undefined;
  const scored = candidates.map((b) => {
    let score = 0;
    if (b.moods.includes(mood)) score += 3;
    if (b.energy >= eMin && b.energy <= eMax) score += 2;
    if (b.id === previousId) score -= 6;
    score -= 2 * (usedInVideo.get(b.id) ?? 0);
    score -= 0.5 * (usage.backgrounds.get(b.id) ?? 0);
    // Tiny seeded jitter breaks ties without making the choice random.
    score += seededRandom(`${seed}|${spec.id}|${sceneIndex}|${b.id}`) * 0.5;
    return { b, score };
  });
  scored.sort((x, y) => y.score - x.score);
  return scored[0]!.b;
}

/**
 * Assigns a library background to every scene that has one and a music bed to the
 * video. Deterministic for a given seed. Leaves anything it cannot match untouched,
 * so an empty library simply keeps the built-in look.
 */
export function routeAssets(
  spec: VideoSpec,
  brand: BrandKit,
  library: AssetLibrary,
  seed: string,
  usage: UsageTracker = newUsageTracker(),
): VideoSpec {
  const usedInVideo = new Map<string, number>();
  let previousId: string | undefined;
  const scenes = spec.scenes.map((scene, i) => {
    if (!(SCENES_WITH_BACKGROUND as readonly string[]).includes(scene.type)) {
      previousId = undefined;
      return scene;
    }
    const withBg = scene as Extract<Scene, { background?: unknown }>;
    if (withBg.background) return scene;
    const pick = pickBackground(scene, i, spec, brand, library, previousId, usedInVideo, usage, seed);
    if (!pick) return scene;
    previousId = pick.id;
    usedInVideo.set(pick.id, (usedInVideo.get(pick.id) ?? 0) + 1);
    usage.backgrounds.set(pick.id, (usage.backgrounds.get(pick.id) ?? 0) + 1);
    return { ...scene, background: { kind: "component" as const, id: pick.id } };
  });

  let music = spec.music;
  if (!music) {
    const mood = RUBRO_MOOD[brand.rubro];
    const [eMin, eMax] = TEMPLATE_ENERGY[spec.template];
    const lengthSec = totalFrames(spec) / 30;
    const tracks = library.music
      .filter((m) => fitsRubro(m.rubros, brand.rubro) && m.durationSec >= Math.min(lengthSec, 20))
      .map((m) => ({
        m,
        score:
          (m.moods.includes(mood) ? 3 : 0) +
          (m.energy >= eMin && m.energy <= eMax ? 2 : 0) -
          (usage.music.has(m.id) ? 6 : 0) +
          seededRandom(`${seed}|${spec.id}|music|${m.id}`) * 0.5,
      }))
      .sort((a, b) => b.score - a.score);
    const track = tracks[0]?.m;
    if (track) {
      usage.music.add(track.id);
      music = { src: track.file, volume: 0.22 };
    }
  }
  return { ...spec, scenes, music };
}

/** Routes the 5 videos of a pack together, so they do not all share the same look. */
export function routePack(specs: VideoSpec[], brand: BrandKit, library: AssetLibrary, seed: string): VideoSpec[] {
  const usage = newUsageTracker();
  return specs.map((s) => routeAssets(s, brand, library, seed, usage));
}

// ─── SFX ─────────────────────────────────────────────────────────────────────

type CueKind = BeatKind | "cut";

const PRIORITY: Record<CueKind, number> = {
  price: 9, slam: 8, button: 7, cut: 6, pop: 5, star: 5, tick: 5, item: 4, reveal: 3, sweep: 2,
};

const VOLUME: Record<SfxCategory, number> = {
  whoosh: 0.5, swipe: 0.45, impact: 0.6, pop: 0.5, riser: 0.45, cash: 0.6, ding: 0.45, tick: 0.4,
  click: 0.35, sparkle: 0.4, sizzle: 0.3, glitch: 0.4, shutter: 0.45, ambience: 0.25,
};

const MAX_INTENSITY: Record<TemplateId, number> = { thumbstopper: 2, pas: 2, showcase: 3, autoridad: 2, oferta: 3 };

function categoriesFor(kind: CueKind, template: TemplateId, rubro: Rubro): SfxCategory[] {
  switch (kind) {
    case "cut":
      return template === "showcase" ? ["swipe", "whoosh"] : ["whoosh", "swipe"];
    case "slam":
      return ["impact"];
    case "reveal":
      return rubro === "estetica" ? ["sparkle", "riser"] : rubro === "gastronomia" ? ["sizzle", "whoosh"] : ["shutter", "whoosh"];
    case "sweep":
      return rubro === "estetica" ? ["sparkle"] : [];
    case "pop":
      return ["pop"];
    case "price":
      return ["cash", "ding", "pop"];
    case "star":
      return ["ding", "pop"];
    case "item":
      return ["click", "pop"];
    case "tick":
      return ["tick"];
    case "button":
      return ["pop", "ding"];
  }
}

/** Minimum frames between two sound effects; closer cues keep the higher-priority one. */
export const SFX_MIN_GAP = 5;

/**
 * Places sound effects on the animation beats (see BEATS) and on scene cuts.
 * Uses only what the library has: a missing category just means no sound there.
 */
export function planSfx(spec: VideoSpec, brand: BrandKit, library: AssetLibrary, seed: string): VideoSpec {
  if (library.sfx.length === 0) return { ...spec, sfx: [] };
  const starts = sceneStarts(spec);
  const end = totalFrames(spec);
  const raw: { frame: number; kind: CueKind }[] = [];
  spec.scenes.forEach((scene, i) => {
    if (i > 0) raw.push({ frame: starts[i]!, kind: "cut" });
    for (const beat of sceneBeats(scene)) {
      if (beat.frame < scene.durationInFrames) raw.push({ frame: starts[i]! + beat.frame, kind: beat.kind });
    }
  });
  raw.sort((a, b) => a.frame - b.frame || PRIORITY[b.kind] - PRIORITY[a.kind]);

  const kept: typeof raw = [];
  for (const cue of raw) {
    if (cue.frame > end - 3) continue;
    const last = kept.at(-1);
    if (last && cue.frame - last.frame < SFX_MIN_GAP) {
      if (PRIORITY[cue.kind] > PRIORITY[last.kind]) kept[kept.length - 1] = cue;
      continue;
    }
    kept.push(cue);
  }

  const maxIntensity = MAX_INTENSITY[spec.template];
  const lastByCategory = new Map<SfxCategory, string>();
  const sfx: VideoSpec["sfx"] = [];
  kept.forEach((cue, n) => {
    for (const category of categoriesFor(cue.kind, spec.template, brand.rubro)) {
      const pool = library.sfx.filter(
        (s) => s.category === category && s.intensity <= maxIntensity && fitsRubro(s.rubros, brand.rubro),
      );
      if (pool.length === 0) continue;
      const fresh = pool.length > 1 ? pool.filter((s) => s.id !== lastByCategory.get(category)) : pool;
      // Prefer the strongest allowed intensity, then pick deterministically among equals.
      const top = Math.max(...fresh.map((s) => s.intensity));
      const best = fresh.filter((s) => s.intensity === top);
      const item: SfxItem = best[Math.floor(seededRandom(`${seed}|${spec.id}|sfx|${n}`) * best.length)]!;
      lastByCategory.set(category, item.id);
      sfx.push({ src: item.file, frame: cue.frame, volume: VOLUME[category] });
      return;
    }
  });
  return { ...spec, sfx };
}
