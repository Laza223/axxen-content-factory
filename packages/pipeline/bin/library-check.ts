/**
 * Validates the asset library against LIBRARY_SPEC.md.
 *   pnpm library:check                 fichas, archivos, duraciones, picos, registro de fondos
 *   pnpm library:check --render        además, una imagen por fondo en packages/video/out/library-check
 *   pnpm library:check --dir library-sample   valida otra carpeta de public/
 */
import { BackgroundMetaSchema, MusicManifestSchema, SfxManifestSchema, type SfxCategory } from "@axxen/core";
import { BACKGROUND_CATALOG } from "@axxen/video/catalog";
import { VIDEO_ENTRY, VIDEO_PUBLIC_DIR } from "@axxen/video/paths";
import { BACKGROUND_COMPONENTS } from "@axxen/video/registry";
import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { parseArgs } from "node:util";
import { cliArgv } from "../src/cli";
import { leadingSilenceMs, peakDb, probeAudio, probeDurationSec } from "../src/media";

const { values: args } = parseArgs({
  args: cliArgv(),
  options: { dir: { type: "string", default: "library" }, render: { type: "boolean", default: false } },
});

const errors: string[] = [];
const warnings: string[] = [];
const err = (m: string) => errors.push(m);

// Rangos de duración por categoría (ms), según LIBRARY_SPEC.md §3.
const SFX_RANGE: Record<SfxCategory, [number, number]> = {
  whoosh: [300, 1200], swipe: [150, 600], impact: [300, 1500], pop: [80, 600], riser: [1000, 4000],
  cash: [300, 1200], ding: [200, 1200], tick: [30, 500], click: [30, 300], sparkle: [300, 2000],
  sizzle: [500, 4000], glitch: [100, 1000], shutter: [100, 800], ambience: [3000, 20000],
};

// 1. Fondos: catálogo ↔ registro.
const catalogIds = new Set<string>();
for (const meta of BACKGROUND_CATALOG) {
  const parsed = BackgroundMetaSchema.safeParse(meta);
  if (!parsed.success) err(`fondo ${meta.id}: ficha inválida: ${parsed.error.message}`);
  if (catalogIds.has(meta.id)) err(`fondo ${meta.id}: id repetido en catalog.ts`);
  catalogIds.add(meta.id);
  if (!BACKGROUND_COMPONENTS[meta.id]) err(`fondo ${meta.id}: está en catalog.ts pero no en registry.tsx`);
}
for (const id of Object.keys(BACKGROUND_COMPONENTS)) {
  if (!catalogIds.has(id)) err(`fondo ${id}: está en registry.tsx pero falta su ficha en catalog.ts`);
}

// 2. SFX y música.
async function checkManifest(kind: "sfx" | "music") {
  const path = join(VIDEO_PUBLIC_DIR, args.dir, kind, "manifest.json");
  if (!existsSync(path)) {
    warnings.push(`${kind}: no hay ${path} (biblioteca vacía)`);
    return;
  }
  const raw = JSON.parse(readFileSync(path, "utf8"));
  const parsed = kind === "sfx" ? SfxManifestSchema.safeParse(raw) : MusicManifestSchema.safeParse(raw);
  if (!parsed.success) {
    err(`${kind}/manifest.json inválido:\n${parsed.error.issues.map((i) => `   ${i.path.join(".")}: ${i.message}`).join("\n")}`);
    return;
  }
  const ids = new Set<string>();
  for (const item of parsed.data.items) {
    const label = `${kind} ${item.id}`;
    if (ids.has(item.id)) err(`${label}: id repetido`);
    ids.add(item.id);
    if (/^https?:/.test(item.file)) continue;
    const file = join(VIDEO_PUBLIC_DIR, item.file);
    if (!existsSync(file)) {
      err(`${label}: no existe ${item.file}`);
      continue;
    }
    const audio = await probeAudio(file);
    if (!audio) {
      err(`${label}: el archivo no tiene audio`);
      continue;
    }
    if (audio.sampleRate < 44100) err(`${label}: ${audio.sampleRate} Hz (mínimo 44100)`);
    const seconds = await probeDurationSec(file);
    if ("durationMs" in item) {
      if (Math.abs(seconds * 1000 - item.durationMs) > 60) err(`${label}: durationMs ${item.durationMs} pero el archivo dura ${Math.round(seconds * 1000)} ms`);
      const [min, max] = SFX_RANGE[item.category];
      if (item.durationMs < min || item.durationMs > max) err(`${label}: ${item.durationMs} ms fuera del rango de "${item.category}" (${min}–${max} ms)`);
      const silence = await leadingSilenceMs(file);
      if (silence > 10) err(`${label}: ${silence} ms de silencio al inicio (máximo 10)`);
    } else {
      if (Math.abs(seconds - item.durationSec) > 1) err(`${label}: durationSec ${item.durationSec} pero dura ${seconds.toFixed(1)} s`);
      if (seconds < 30) err(`${label}: dura ${seconds.toFixed(1)} s (mínimo 30)`);
    }
    const peak = await peakDb(file);
    if (peak > -0.5) err(`${label}: pico de ${peak} dBFS (máximo -0,5)`);
    if (item.license.source === "placeholder-ffmpeg") warnings.push(`${label}: sonido de relleno, no usar con clientes`);
  }
  console.log(`${kind}: ${parsed.data.items.length} ítems revisados`);
}
await checkManifest("sfx");
await checkManifest("music");
console.log(`fondos: ${BACKGROUND_CATALOG.length} en el catálogo`);

// 3. Render opcional de cada fondo.
if (args.render && errors.length === 0) {
  const { bundle } = await import("@remotion/bundler");
  const { renderStill, selectComposition } = await import("@remotion/renderer");
  const out = join(VIDEO_PUBLIC_DIR, "..", "out", "library-check");
  mkdirSync(out, { recursive: true });
  const serveUrl = await bundle({ entryPoint: VIDEO_ENTRY, publicDir: VIDEO_PUBLIC_DIR });
  const browserExecutable = process.env.REMOTION_BROWSER || null;
  for (const meta of BACKGROUND_CATALOG) {
    const inputProps = { backgroundId: meta.id };
    const composition = await selectComposition({ serveUrl, id: "BackgroundPreview", inputProps, browserExecutable });
    const started = Date.now();
    await renderStill({ composition, serveUrl, frame: 45, output: join(out, `${meta.id}.png`), inputProps, browserExecutable });
    console.log(`  ${meta.id}.png (${Date.now() - started} ms)`);
  }
  console.log(`imágenes en ${out}`);
}

for (const w of warnings) console.log(`⚠ ${w}`);
if (errors.length > 0) {
  for (const e of errors) console.error(`✗ ${e}`);
  console.error(`\n${errors.length} error(es)`);
  process.exit(1);
}
console.log("✓ biblioteca OK");
