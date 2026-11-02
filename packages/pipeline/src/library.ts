import {
  MusicManifestSchema,
  SfxManifestSchema,
  type AssetLibrary,
  type MusicItem,
  type SfxItem,
} from "@axxen/core";
import { BACKGROUND_CATALOG } from "@axxen/video/catalog";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Loads the asset library: background metadata from the video package's catalog and
 * SFX/music manifests from `<publicDir>/<dir>/{sfx,music}/manifest.json`.
 * A missing manifest is an empty list, so the pipeline works before the library exists.
 */
export function loadLibrary(publicDir: string, dir = "library"): AssetLibrary {
  const read = <T>(file: string, parse: (raw: unknown) => { items: T[] }): T[] => {
    const path = join(publicDir, dir, file);
    if (!existsSync(path)) return [];
    return parse(JSON.parse(readFileSync(path, "utf8"))).items;
  };
  return {
    backgrounds: BACKGROUND_CATALOG,
    sfx: read<SfxItem>("sfx/manifest.json", (r) => SfxManifestSchema.parse(r)),
    music: read<MusicItem>("music/manifest.json", (r) => MusicManifestSchema.parse(r)),
  };
}

/** Merges libraries; the first one wins on duplicate ids. */
export function mergeLibraries(...libs: AssetLibrary[]): AssetLibrary {
  const uniq = <T extends { id: string }>(items: T[]) => [...new Map(items.reverse().map((i) => [i.id, i])).values()].reverse();
  return {
    backgrounds: uniq(libs.flatMap((l) => l.backgrounds)),
    sfx: uniq(libs.flatMap((l) => l.sfx)),
    music: uniq(libs.flatMap((l) => l.music)),
  };
}
