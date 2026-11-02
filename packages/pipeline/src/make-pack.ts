import {
  DirectorOutputSchema,
  VideoSpecSchema,
  applySpeechTimings,
  checkDirectorOutput,
  planSfx,
  routePack,
  speechClipOffsetsMs,
  toVideoSpecs,
  validatePack,
  withEstimatedSpeech,
  type AssetLibrary,
  type BrandKit,
  type DirectorOutput,
  type Interview,
  type TemplateId,
  type VideoSpec,
  type Word,
} from "@axxen/core";
import { VIDEO_PUBLIC_DIR } from "@axxen/video/paths";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { CostLedger, PRICES } from "./costs";
import { runDirector, type CreateMessage, type Effort } from "./director/run";
import { finalizeVideo } from "./finalize";
import { bundleVideo, renderSceneStills, renderSpec, type RenderOptions } from "./render";
import { VOICES, type TtsProvider } from "./tts/types";

/** Where the script comes from: Claude, a saved director output, or ready-made specs. */
export type ScriptSource =
  | { kind: "claude"; interview: Interview; model?: string; effort?: Effort; createMessage?: CreateMessage }
  | { kind: "director-output"; output: unknown }
  | { kind: "specs"; specs: unknown[] };

export interface MakePackOptions {
  brand: BrandKit;
  script: ScriptSource;
  packId: string;
  outDir: string;
  library: AssetLibrary;
  /** null → no voice audio; captions use estimated timings. */
  tts: TtsProvider | null;
  /** Bill TTS characters at Azure's price (false for dev/cached voices). */
  ttsBillable?: boolean;
  seed?: string;
  only?: TemplateId;
  stillsOnly?: boolean;
  keepRunFiles?: boolean;
  render?: RenderOptions;
  log?: (msg: string) => void;
}

export interface MakePackResult {
  specs: VideoSpec[];
  videos: string[];
  costs: ReturnType<CostLedger["toJSON"]>;
}

const RATE: Record<TemplateId, string> = { thumbstopper: "+4%", pas: "0%", showcase: "+8%", autoridad: "0%", oferta: "+8%" };

async function mapLimit<T, R>(items: T[], limit: number, fn: (item: T, i: number) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (next < items.length) {
        const i = next++;
        out[i] = await fn(items[i]!, i);
      }
    }),
  );
  return out;
}

export async function makePack(opts: MakePackOptions): Promise<MakePackResult> {
  const { brand, packId, outDir, library, tts, log = console.log } = opts;
  const seed = opts.seed ?? packId;
  const ledger = new CostLedger();
  const t0 = Date.now();
  const step = (name: string) => log(`\n▶ ${name} (${((Date.now() - t0) / 1000).toFixed(0)}s)`);
  mkdirSync(outDir, { recursive: true });

  // 1. Guiones.
  step("guiones");
  let specs: VideoSpec[];
  let director: DirectorOutput | undefined;
  if (opts.script.kind === "specs") {
    specs = opts.script.specs.map((s) => VideoSpecSchema.parse(s));
  } else if (opts.script.kind === "director-output") {
    director = DirectorOutputSchema.parse(opts.script.output);
    const issues = checkDirectorOutput(director, brand, packId);
    if (issues.length > 0) throw new Error(`director output inválido:\n${issues.map((i) => `  [${i.specId}] ${i.message}`).join("\n")}`);
    specs = toVideoSpecs(director, packId);
  } else {
    const result = await runDirector({ brand, packId, ledger, log, ...opts.script });
    director = result.output;
    specs = result.specs;
  }
  if (director) writeFileSync(join(outDir, "director.json"), JSON.stringify(director, null, 2));
  if (opts.only) specs = specs.filter((s) => s.template === opts.only);

  // 2. Voz: un clip por escena; las escenas se estiran a lo que dura la voz real.
  const runDir = join("runs", packId);
  const runAbs = join(VIDEO_PUBLIC_DIR, runDir);
  if (tts) {
    step(`voz (${tts.name})`);
    mkdirSync(join(runAbs, "voice"), { recursive: true });
    let billed = 0;
    specs = await Promise.all(
      specs.map(async (spec, v) => {
        const voice = v % 2 === 0 ? VOICES.female : VOICES.male;
        const speech = await mapLimit(spec.scenes, 3, async (scene, i) => {
          if (!scene.say) return null;
          const r = await tts.synthesize(scene.say, { voice, rate: RATE[spec.template] });
          billed += r.billedChars;
          const file = join(runDir, "voice", `${spec.id}-${String(i).padStart(2, "0")}.mp3`);
          writeFileSync(join(VIDEO_PUBLIC_DIR, file), r.audio);
          return { words: r.words as Word[], file };
        });
        const timed = applySpeechTimings(spec, speech.map((s) => s?.words ?? null));
        const offsets = speechClipOffsetsMs(timed);
        const clips = speech.flatMap((s, i) => (s ? [{ src: s.file, startMs: offsets[i]! }] : []));
        return { ...timed, voice: { ...timed.voice, clips } };
      }),
    );
    if (opts.ttsBillable) {
      ledger.add({ step: "voz", provider: tts.name, detail: `${billed} caracteres`, usd: (billed / 1_000_000) * PRICES.azureTtsPerMChars });
    }
  } else {
    specs = specs.map((s) => (s.voice.words.length > 0 ? s : withEstimatedSpeech(s)));
  }

  // 3. Fondos y música, 4. efectos de sonido (sobre las duraciones finales).
  step("recursos y efectos");
  specs = routePack(specs, brand, library, seed).map((s) => planSfx(s, brand, library, seed));
  specs = specs.map((s) => VideoSpecSchema.parse(s));
  for (const s of specs) {
    log(`  ${s.id}: ${(s.scenes.reduce((n, sc) => n + sc.durationInFrames, 0) / 30).toFixed(1)}s, ${s.sfx.length} sfx, música ${s.music ? "sí" : "no"}, fondos ${[...new Set(s.scenes.flatMap((sc) => ("background" in sc && sc.background?.kind === "component" ? [sc.background.id] : [])))].join(", ") || "default"}`);
  }
  const issues = opts.only ? [] : validatePack(specs, brand);
  for (const i of issues) log(`  ⚠ [${i.specId}] ${i.message}`);
  writeFileSync(join(outDir, "specs.json"), JSON.stringify(specs, null, 2));

  // 5. Render + 6. terminación.
  step("render");
  const serveUrl = await bundleVideo();
  const videos: string[] = [];
  try {
    if (opts.stillsOnly) {
      for (const spec of specs) videos.push(...(await renderSceneStills(serveUrl, brand, spec, outDir, opts.render)));
    } else {
      const rawDir = join(outDir, "raw");
      mkdirSync(rawDir, { recursive: true });
      for (const spec of specs) {
        const started = Date.now();
        const raw = join(rawDir, `${spec.id}.mp4`);
        await renderSpec(serveUrl, brand, spec, raw, opts.render);
        const final = join(outDir, `${spec.id}.mp4`);
        await finalizeVideo(raw, final, join(outDir, `${spec.id}.jpg`));
        videos.push(final);
        log(`  ✓ ${spec.id} (${((Date.now() - started) / 1000).toFixed(0)}s)`);
      }
      rmSync(rawDir, { recursive: true, force: true });
    }
  } finally {
    if (!opts.keepRunFiles) rmSync(runAbs, { recursive: true, force: true });
  }

  const costs = ledger.toJSON();
  writeFileSync(join(outDir, "costs.json"), JSON.stringify(costs, null, 2));
  step(`listo: ${videos.length} archivos, costo de APIs US$ ${costs.totalUsd.toFixed(3)}`);
  return { specs, videos, costs };
}
