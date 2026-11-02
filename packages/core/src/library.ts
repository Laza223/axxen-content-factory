import { z } from "zod";
import { AssetSrcSchema, RubroSchema } from "./brand";
import { MoodSchema } from "./spec";

/**
 * Asset library contract. The parallel "library" work produces assets in exactly this
 * shape; the asset router and SFX planner only ever read these schemas.
 * See LIBRARY_SPEC.md at the repo root for the human version.
 */

const id = z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "ids are kebab-case: lowercase letters, digits, dashes");
/** Empty list = suitable for every rubro. */
const rubros = z.array(RubroSchema).default([]);

export const LicenseSchema = z.object({
  /** Where it came from: "propio", "pixabay", "freesound-cc0", "epidemic"... */
  source: z.string().min(1),
  url: z.string().optional(),
  /** Required text when the license asks for attribution; omit otherwise. */
  attribution: z.string().optional(),
});

/** Metadata of an animated background implemented as a Remotion component. */
export const BackgroundMetaSchema = z.object({
  id,
  name: z.string().min(1),
  rubros,
  moods: z.array(MoodSchema).min(1),
  /** 1 calm … 3 frantic. Fast templates prefer 2–3, "autoridad" prefers 1–2. */
  energy: z.number().int().min(1).max(3),
  brightness: z.enum(["dark", "light"]),
  /** Calm enough to carry big headlines on top. */
  textSafe: z.boolean(),
  /** Center area stays clear for a product cut-out. */
  productSafe: z.boolean(),
  /** A stage made for a product (podium, spotlight): only used when a product is on screen. */
  stage: z.boolean().default(false),
  author: z.string().min(1),
});
export type BackgroundMeta = z.infer<typeof BackgroundMetaSchema>;

export const SFX_CATEGORIES = [
  "whoosh", // transitions between scenes
  "swipe", // very fast cuts (catalog)
  "impact", // text slams
  "pop", // stickers, badges, buttons
  "riser", // build-up before a reveal
  "cash", // price lands
  "ding", // positive confirmation, stars
  "tick", // clocks, countdowns
  "click", // list items
  "sparkle", // beauty / luxury accents
  "sizzle", // food ambience
  "glitch", // urban / tech accents
  "shutter", // camera, fashion
  "ambience", // long beds under a scene
] as const;
export const SfxCategorySchema = z.enum(SFX_CATEGORIES);
export type SfxCategory = z.infer<typeof SfxCategorySchema>;

export const SfxItemSchema = z.object({
  id,
  /** Path under packages/video/public (e.g. "library/sfx/pop/pop-soft-01.mp3") or an https URL. */
  file: AssetSrcSchema,
  durationMs: z.number().int().positive(),
  category: SfxCategorySchema,
  /** 1 subtle … 3 loud/aggressive. */
  intensity: z.number().int().min(1).max(3),
  rubros,
  tags: z.array(z.string()).default([]),
  license: LicenseSchema,
});
export type SfxItem = z.infer<typeof SfxItemSchema>;

export const MusicItemSchema = z.object({
  id,
  file: AssetSrcSchema,
  durationSec: z.number().positive(),
  bpm: z.number().positive().optional(),
  moods: z.array(MoodSchema).min(1),
  energy: z.number().int().min(1).max(3),
  rubros,
  license: LicenseSchema,
});
export type MusicItem = z.infer<typeof MusicItemSchema>;

export const SfxManifestSchema = z.object({ version: z.literal(1), items: z.array(SfxItemSchema) });
export const MusicManifestSchema = z.object({ version: z.literal(1), items: z.array(MusicItemSchema) });

export interface AssetLibrary {
  backgrounds: BackgroundMeta[];
  sfx: SfxItem[];
  music: MusicItem[];
}

export const EMPTY_LIBRARY: AssetLibrary = { backgrounds: [], sfx: [], music: [] };
