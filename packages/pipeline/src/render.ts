import type { BrandKit, VideoSpec } from "@axxen/core";
import { VIDEO_ENTRY, VIDEO_PUBLIC_DIR } from "@axxen/video/paths";
import { bundle } from "@remotion/bundler";
import { renderMedia, renderStill, selectComposition } from "@remotion/renderer";
import { join } from "node:path";

export interface RenderOptions {
  /** Chrome Headless Shell binary; null lets Remotion download its own. */
  browserExecutable?: string | null;
  concurrency?: number | null;
  preview?: boolean;
  log?: (msg: string) => void;
}

/** Bundles once (after all per-pack files are in public/) and returns the serve URL. */
export async function bundleVideo(): Promise<string> {
  return bundle({ entryPoint: VIDEO_ENTRY, publicDir: VIDEO_PUBLIC_DIR });
}

export async function renderSpec(
  serveUrl: string,
  brand: BrandKit,
  spec: VideoSpec,
  outputLocation: string,
  opts: RenderOptions = {},
): Promise<void> {
  const inputProps = { brand, spec, preview: opts.preview ?? false };
  const browserExecutable = opts.browserExecutable ?? null;
  const composition = await selectComposition({ serveUrl, id: "PackVideo", inputProps, browserExecutable });
  await renderMedia({
    composition,
    serveUrl,
    codec: "h264",
    crf: 16,
    outputLocation,
    inputProps,
    browserExecutable,
    concurrency: opts.concurrency ?? null,
    imageFormat: "jpeg",
    jpegQuality: 92,
  });
}

/** One PNG per scene, a few frames in (after entrance animations). */
export async function renderSceneStills(
  serveUrl: string,
  brand: BrandKit,
  spec: VideoSpec,
  outDir: string,
  opts: RenderOptions = {},
): Promise<string[]> {
  const inputProps = { brand, spec, preview: opts.preview ?? false };
  const browserExecutable = opts.browserExecutable ?? null;
  const composition = await selectComposition({ serveUrl, id: "PackVideo", inputProps, browserExecutable });
  const files: string[] = [];
  let start = 0;
  for (const [i, scene] of spec.scenes.entries()) {
    const frame = Math.min(start + Math.min(24, scene.durationInFrames - 1), composition.durationInFrames - 1);
    const output = join(outDir, `${spec.id}__${String(i).padStart(2, "0")}-${scene.type}.png`);
    await renderStill({ composition, serveUrl, output, frame, inputProps, browserExecutable, imageFormat: "png" });
    files.push(output);
    start += scene.durationInFrames;
  }
  return files;
}
