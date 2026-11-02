/**
 * Brand (+ interview) → 5 finished Reels.
 *
 *   pnpm make-pack --brand b.json --interview i.json                  # Claude + Azure (producción)
 *   pnpm make-pack --brand b.json --director-from d.json --tts espeak  # sin API keys, voz de desarrollo
 *   pnpm make-pack --brand b.json --specs pack.json --tts none         # specs ya escritas, sin voz
 *
 * Opciones: --out DIR, --pack-id ID, --library library,library-sample, --seed S, --only TEMPLATE,
 *           --stills, --preview, --keep-run, --model M, --effort E, --tts azure|espeak|none
 * Env: ANTHROPIC_API_KEY, AZURE_SPEECH_KEY, AZURE_SPEECH_REGION, REMOTION_BROWSER (opcional).
 */
import { BrandKitSchema, InterviewSchema, TemplateIdSchema } from "@axxen/core";
import { VIDEO_PUBLIC_DIR } from "@axxen/video/paths";
import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { parseArgs } from "node:util";
import { cliArgv } from "../src/cli";
import type { Effort } from "../src/director/run";
import { loadLibrary, mergeLibraries } from "../src/library";
import { makePack, type ScriptSource } from "../src/make-pack";
import { AzureTts } from "../src/tts/azure";
import { CachedTts } from "../src/tts/cache";
import { EspeakTts } from "../src/tts/espeak";

const { values: a } = parseArgs({
  args: cliArgv(),
  options: {
    brand: { type: "string" },
    interview: { type: "string" },
    "director-from": { type: "string" },
    specs: { type: "string" },
    out: { type: "string" },
    "pack-id": { type: "string" },
    library: { type: "string", default: "library" },
    seed: { type: "string" },
    only: { type: "string" },
    stills: { type: "boolean", default: false },
    preview: { type: "boolean", default: false },
    "keep-run": { type: "boolean", default: false },
    model: { type: "string", default: "claude-opus-5-5" },
    effort: { type: "string", default: "medium" },
    tts: { type: "string", default: "azure" },
  },
});

const readJson = (p: string) => JSON.parse(readFileSync(resolve(p), "utf8")) as unknown;
if (!a.brand) throw new Error("falta --brand");
const brand = BrandKitSchema.parse(readJson(a.brand));

let script: ScriptSource;
if (a.specs) script = { kind: "specs", specs: readJson(a.specs) as unknown[] };
else if (a["director-from"]) script = { kind: "director-output", output: readJson(a["director-from"]) };
else {
  if (!a.interview) throw new Error("falta --interview (o --director-from / --specs)");
  script = { kind: "claude", interview: InterviewSchema.parse(readJson(a.interview)), model: a.model, effort: a.effort as Effort };
}

const slug = brand.name.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const stamp = new Date().toISOString().slice(0, 16).replace(/[-:T]/g, "");
const packId = a["pack-id"] ?? `${slug}-${stamp}`;
const outDir = resolve(a.out ?? join(process.cwd(), "out", packId));
const ttsCache = join(VIDEO_PUBLIC_DIR, "..", ".cache", "tts");

const tts =
  a.tts === "none" ? null : a.tts === "espeak" ? new CachedTts(new EspeakTts(), ttsCache) : new CachedTts(new AzureTts(), ttsCache);

const library = mergeLibraries(...a.library.split(",").map((d) => loadLibrary(VIDEO_PUBLIC_DIR, d.trim())));
console.log(`pack ${packId} → ${outDir}`);
console.log(`biblioteca: ${library.backgrounds.length} fondos, ${library.sfx.length} sfx, ${library.music.length} música`);

await makePack({
  brand,
  script,
  packId,
  outDir,
  library,
  tts,
  ttsBillable: a.tts === "azure",
  seed: a.seed,
  only: a.only ? TemplateIdSchema.parse(a.only) : undefined,
  stillsOnly: a.stills,
  keepRunFiles: a["keep-run"],
  render: { browserExecutable: process.env.REMOTION_BROWSER || null, preview: a.preview },
});
