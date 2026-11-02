import { z } from "zod";
import { AssetSrcSchema, type Rubro } from "./brand";

export const FPS = 30;
export const WIDTH = 1080;
export const HEIGHT = 1920;

/**
 * Instagram Reels UI covers the top bar, the caption/CTA block at the bottom and the
 * action buttons on the right. Text must stay inside this box.
 */
export const SAFE_ZONE = { top: 220, bottom: 420, left: 60, right: 140 } as const;

/**
 * Max characters per text field. These are layout limits: every text block was sized
 * so that the longest allowed string still fits at the template's font size.
 * The LLM gets the same limits through the JSON schema.
 */
export const TEXT_LIMITS = {
  brollText: 40,
  punchLine: 22,
  heroHeadline: 30,
  flashLabel: 24,
  priceHeadline: 28,
  installments: 30,
  bulletsTitle: 28,
  bulletItem: 30,
  deadlineHeadline: 24,
  deadlineText: 40,
  ctaHeadline: 28,
  ctaSubline: 40,
  say: 180,
} as const;

const frames = (min: number, max: number) => z.number().int().min(min).max(max);
const sceneDuration = frames(12, 300);

/**
 * What the voice-over says while this scene is on screen. Keeping the script per scene
 * is what keeps voice, captions and visuals in sync: scene durations are stretched to
 * fit the real TTS audio (see applySpeechTimings).
 */
const say = z.string().min(1).max(TEXT_LIMITS.say).optional();

export const MOODS = ["fuego", "lujo", "urbano", "fresco", "calido", "energia"] as const;
export const MoodSchema = z.enum(MOODS);
export type Mood = z.infer<typeof MoodSchema>;

/** Default visual mood per business type, for scenes that do not carry their own. */
export const RUBRO_MOOD: Record<Rubro, Mood> = {
  gastronomia: "fuego",
  indumentaria: "urbano",
  estetica: "lujo",
};

/**
 * What sits behind a scene. Chosen by the asset router, never by the LLM:
 * - component: an animated background from the Remotion library (packages/video/src/library),
 * - clip: a video file (library clip or a per-client AI clip).
 * Absent → the built-in animated brand backdrop.
 */
export const BackgroundRefSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("component"), id: z.string().min(1) }),
  z.object({ kind: z.literal("clip"), src: AssetSrcSchema, startFromFrame: z.number().int().min(0).default(0) }),
]);
export type BackgroundRef = z.infer<typeof BackgroundRefSchema>;
const background = BackgroundRefSchema.optional();

export const BrollSceneSchema = z.object({
  type: z.literal("broll"),
  durationInFrames: sceneDuration,
  say,
  background,
  mood: MoodSchema,
  text: z.string().max(TEXT_LIMITS.brollText).optional(),
});

export const TextPunchSceneSchema = z.object({
  type: z.literal("text_punch"),
  durationInFrames: sceneDuration,
  say,
  background,
  lines: z.array(z.string().min(1).max(TEXT_LIMITS.punchLine)).min(1).max(3),
  /** Index of the line drawn in the accent color. */
  highlight: z.number().int().min(0).max(2).optional(),
});

export const ProductHeroSceneSchema = z.object({
  type: z.literal("product_hero"),
  durationInFrames: sceneDuration,
  say,
  productId: z.string().min(1),
  headline: z.string().max(TEXT_LIMITS.heroHeadline).optional(),
  motion: z.enum(["push", "rise", "orbit"]),
  background,
});

export const ProductFlashSceneSchema = z.object({
  type: z.literal("product_flash"),
  durationInFrames: frames(9, 60),
  say,
  productId: z.string().min(1),
  label: z.string().max(TEXT_LIMITS.flashLabel).optional(),
  showPrice: z.boolean(),
});

export const PriceCardSceneSchema = z.object({
  type: z.literal("price_card"),
  durationInFrames: sceneDuration,
  say,
  background,
  productId: z.string().min(1).optional(),
  headline: z.string().min(1).max(TEXT_LIMITS.priceHeadline),
  price: z.number().int().positive(),
  oldPrice: z.number().int().positive().optional(),
  installments: z.string().max(TEXT_LIMITS.installments).optional(),
});

export const ReviewCardSceneSchema = z.object({
  type: z.literal("review_card"),
  durationInFrames: sceneDuration,
  say,
  background,
  reviewIndex: z.number().int().min(0),
});

export const BulletsSceneSchema = z.object({
  type: z.literal("bullets"),
  durationInFrames: sceneDuration,
  say,
  background,
  title: z.string().min(1).max(TEXT_LIMITS.bulletsTitle),
  items: z.array(z.string().min(1).max(TEXT_LIMITS.bulletItem)).min(2).max(4),
});

export const DeadlineSceneSchema = z.object({
  type: z.literal("deadline"),
  durationInFrames: sceneDuration,
  say,
  background,
  headline: z.string().min(1).max(TEXT_LIMITS.deadlineHeadline),
  deadline: z.string().min(1).max(TEXT_LIMITS.deadlineText),
});

export const CtaSceneSchema = z.object({
  type: z.literal("cta"),
  durationInFrames: sceneDuration,
  say,
  headline: z.string().min(1).max(TEXT_LIMITS.ctaHeadline),
  subline: z.string().max(TEXT_LIMITS.ctaSubline).optional(),
});

export const SceneSchema = z.discriminatedUnion("type", [
  BrollSceneSchema,
  TextPunchSceneSchema,
  ProductHeroSceneSchema,
  ProductFlashSceneSchema,
  PriceCardSceneSchema,
  ReviewCardSceneSchema,
  BulletsSceneSchema,
  DeadlineSceneSchema,
  CtaSceneSchema,
]);
export type Scene = z.infer<typeof SceneSchema>;
export type SceneType = Scene["type"];
export type SceneOf<T extends SceneType> = Extract<Scene, { type: T }>;

export const WordSchema = z.object({
  text: z.string().min(1),
  startMs: z.number().min(0),
  endMs: z.number().min(0),
});
export type Word = z.infer<typeof WordSchema>;

export const TEMPLATE_IDS = ["thumbstopper", "pas", "showcase", "autoridad", "oferta"] as const;
export const TemplateIdSchema = z.enum(TEMPLATE_IDS);
export type TemplateId = z.infer<typeof TemplateIdSchema>;

export const VideoSpecSchema = z.object({
  id: z.string().min(1),
  template: TemplateIdSchema,
  voice: z.object({
    /** One TTS clip per scene that speaks, placed at `startMs` (see speechClipOffsetsMs). */
    clips: z.array(z.object({ src: AssetSrcSchema, startMs: z.number().min(0) })).default([]),
    /** Optional pre-mixed voice track, used instead of `clips` when present. */
    src: AssetSrcSchema.optional(),
    /** Absent audio (free preview) still has words: captions play from estimated timings. */
    words: z.array(WordSchema),
  }),
  music: z
    .object({ src: AssetSrcSchema, volume: z.number().min(0).max(1).default(0.22) })
    .optional(),
  /** Sound effects placed on animation beats by the SFX planner. */
  sfx: z
    .array(z.object({ src: AssetSrcSchema, frame: z.number().int().min(0), volume: z.number().min(0).max(1) }))
    .default([]),
  captionStyle: z.enum(["bold", "clean"]),
  scenes: z.array(SceneSchema).min(2).max(24),
});
export type VideoSpec = z.infer<typeof VideoSpecSchema>;

/** Scene types drawn over a background (and therefore routed by the asset router). */
export const SCENES_WITH_BACKGROUND = [
  "broll", "text_punch", "product_hero", "price_card", "review_card", "bullets", "deadline",
] as const satisfies readonly SceneType[];

export const totalFrames = (spec: Pick<VideoSpec, "scenes">): number =>
  spec.scenes.reduce((sum, s) => sum + s.durationInFrames, 0);

/** Full voice-over script, as written by the director (before TTS normalization). */
export const voiceoverText = (spec: Pick<VideoSpec, "scenes">): string =>
  spec.scenes.flatMap((s) => (s.say ? [s.say] : [])).join(" ");

/** First frame of each scene. */
export const sceneStarts = (spec: Pick<VideoSpec, "scenes">): number[] => {
  let t = 0;
  return spec.scenes.map((s) => {
    const start = t;
    t += s.durationInFrames;
    return start;
  });
};
