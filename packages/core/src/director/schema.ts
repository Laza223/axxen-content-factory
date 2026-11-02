import { z } from "zod";
import type { BrandKit } from "../brand";
import {
  BrollSceneSchema,
  BulletsSceneSchema,
  CtaSceneSchema,
  DeadlineSceneSchema,
  PriceCardSceneSchema,
  ProductFlashSceneSchema,
  ProductHeroSceneSchema,
  ReviewCardSceneSchema,
  TemplateIdSchema,
  TextPunchSceneSchema,
  VideoSpecSchema,
  type Scene,
  type SceneType,
  type VideoSpec,
} from "../spec";
import { validatePack, type SpecIssue } from "../templates";
import { applySpeechTimings, estimateWordTimings } from "../timing";

/**
 * What the LLM writes: scene content only. Durations come from the voice (TTS or
 * estimate) and backgrounds from the asset router, so both are left out here.
 */
const noBg = { durationInFrames: true, background: true } as const;
const noDur = { durationInFrames: true } as const;
export const LlmSceneSchema = z.discriminatedUnion("type", [
  BrollSceneSchema.omit(noBg),
  TextPunchSceneSchema.omit(noBg),
  ProductHeroSceneSchema.omit(noBg),
  ProductFlashSceneSchema.omit(noDur),
  PriceCardSceneSchema.omit(noBg),
  ReviewCardSceneSchema.omit(noBg),
  BulletsSceneSchema.omit(noBg),
  DeadlineSceneSchema.omit(noBg),
  CtaSceneSchema.omit(noDur),
]);
export type LlmScene = z.infer<typeof LlmSceneSchema>;

export const BriefSchema = z.object({
  buyer: z.string().min(1).max(240).describe("Comprador ideal, en una frase"),
  pain: z.string().min(1).max(240).describe("El dolor o frustración principal del comprador"),
  desire: z.string().min(1).max(240).describe("Lo que el comprador quiere sentir o lograr"),
  offer: z.string().min(1).max(240).describe("La oferta que empuja el pack, tomada de los datos"),
  differentiators: z
    .array(
      z.object({
        text: z.string().min(1).max(140),
        source: z.string().min(1).max(100).describe("De qué dato del negocio o de la entrevista sale"),
      }),
    )
    .min(1)
    .max(5),
  objections: z.array(z.string().min(1).max(160)).max(3),
});
export type Brief = z.infer<typeof BriefSchema>;

export const LlmVideoSchema = z.object({
  template: TemplateIdSchema,
  captionStyle: z.enum(["bold", "clean"]),
  scenes: z.array(LlmSceneSchema).min(2).max(14),
});

export const DirectorOutputSchema = z.object({
  brief: BriefSchema,
  videos: z.array(LlmVideoSchema).length(5),
});
export type DirectorOutput = z.infer<typeof DirectorOutputSchema>;

/** Minimum on-screen time per scene type, before the voice stretches it (frames @30fps). */
export const DEFAULT_SCENE_FRAMES: Record<SceneType, number> = {
  broll: 60,
  text_punch: 54,
  product_hero: 105,
  product_flash: 36,
  price_card: 120,
  review_card: 120,
  bullets: 150,
  deadline: 75,
  cta: 90,
};

const TEMPLATE_ORDER = ["thumbstopper", "pas", "showcase", "autoridad", "oferta"] as const;

/** LLM output → base specs (minimum durations, no audio, no backgrounds). */
export function toVideoSpecs(output: DirectorOutput, packId: string): VideoSpec[] {
  return output.videos.map((v) => {
    const n = TEMPLATE_ORDER.indexOf(v.template) + 1;
    return {
      id: `${packId}-${n}-${v.template}`,
      template: v.template,
      captionStyle: v.captionStyle,
      voice: { clips: [], words: [] },
      sfx: [],
      scenes: v.scenes.map((s) => ({ ...s, durationInFrames: DEFAULT_SCENE_FRAMES[s.type] }) as Scene),
    };
  });
}

/** Stretches scenes to the estimated length of their lines and fills caption timings. */
export const withEstimatedSpeech = (spec: VideoSpec): VideoSpec =>
  applySpeechTimings(
    spec,
    spec.scenes.map((s) => (s.say ? estimateWordTimings(s.say, { startMs: 0 }) : null)),
  );

/**
 * Everything the director must fix before a pack can be rendered: schema problems
 * (e.g. a scene stretched past its max length by a long line) and pack/template rules.
 */
export function checkDirectorOutput(output: DirectorOutput, brand: BrandKit, packId: string): SpecIssue[] {
  const specs = toVideoSpecs(output, packId).map(withEstimatedSpeech);
  const issues: SpecIssue[] = [];
  for (const spec of specs) {
    const parsed = VideoSpecSchema.safeParse(spec);
    if (!parsed.success) {
      for (const i of parsed.error.issues) {
        const [, sceneIdx, field] = i.path;
        const where = i.path[0] === "scenes" ? `escena ${String(sceneIdx)} (${spec.scenes[Number(sceneIdx)]?.type})` : i.path.join(".");
        const msg =
          field === "durationInFrames"
            ? "la frase de voz es demasiado larga para este tipo de escena: acortala"
            : i.message;
        issues.push({ specId: spec.id, message: `${where}: ${msg}` });
      }
    }
  }
  issues.push(...validatePack(specs, brand));
  return issues;
}
