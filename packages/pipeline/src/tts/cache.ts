import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { TtsOptions, TtsProvider, TtsResult } from "./types";

/**
 * Disk cache in front of a TTS provider: re-rendering a pack (or a fix to one video)
 * never pays for the same line twice.
 */
export class CachedTts implements TtsProvider {
  readonly name: string;
  hits = 0;

  constructor(
    private readonly inner: TtsProvider,
    private readonly dir: string,
  ) {
    this.name = `${inner.name}+cache`;
    mkdirSync(dir, { recursive: true });
  }

  async synthesize(text: string, opts: TtsOptions): Promise<TtsResult> {
    const key = createHash("sha256").update(`${this.inner.name}|${opts.voice}|${opts.rate}|${text}`).digest("hex").slice(0, 32);
    const audioPath = join(this.dir, `${key}.mp3`);
    const metaPath = join(this.dir, `${key}.json`);
    if (existsSync(audioPath) && existsSync(metaPath)) {
      this.hits++;
      const meta = JSON.parse(readFileSync(metaPath, "utf8")) as Omit<TtsResult, "audio" | "billedChars">;
      return { ...meta, audio: readFileSync(audioPath), billedChars: 0 };
    }
    const result = await this.inner.synthesize(text, opts);
    writeFileSync(audioPath, result.audio);
    writeFileSync(metaPath, JSON.stringify({ words: result.words, durationMs: result.durationMs }));
    return result;
  }
}
