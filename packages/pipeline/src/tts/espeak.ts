import { speechTokens } from "@axxen/core";
import { execFile } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import { probeDurationSec } from "../media";
import type { TtsOptions, TtsProvider, TtsResult } from "./types";

const run = promisify(execFile);

/**
 * Development-only voice (espeak-ng, robotic). Synthesizes word by word and concatenates,
 * so caption timings are exact. Lets the whole audio path run without cloud keys.
 * Never use it for client videos.
 */
export class EspeakTts implements TtsProvider {
  readonly name = "espeak-dev";

  async synthesize(script: string, opts: TtsOptions): Promise<TtsResult> {
    const tokens = speechTokens(script);
    const dir = mkdtempSync(join(tmpdir(), "espeak-"));
    try {
      const female = opts.voice.includes("Elena");
      const speed = Math.round(175 * (1 + (Number.parseFloat(opts.rate) || 0) / 100));
      const parts = await Promise.all(
        tokens.map(async (t, i) => {
          const wav = join(dir, `w${String(i).padStart(3, "0")}.wav`);
          await run("espeak-ng", ["-v", female ? "es-419+f3" : "es-419", "-s", String(speed), "-g", "1", "-w", wav, t.spoken]);
          // Trim espeak's own leading/trailing silence so words sit back to back.
          const trimmed = join(dir, `t${String(i).padStart(3, "0")}.wav`);
          await run("ffmpeg", ["-loglevel", "error", "-y", "-i", wav, "-af",
            "silenceremove=start_periods=1:start_threshold=-45dB,areverse,silenceremove=start_periods=1:start_threshold=-45dB,areverse,apad=pad_dur=0.06",
            "-ar", "48000", "-ac", "1", trimmed]);
          return { file: trimmed, sec: await probeDurationSec(trimmed), original: t.original };
        }),
      );
      const list = join(dir, "list.txt");
      writeFileSync(list, parts.map((p) => `file '${p.file}'`).join("\n"));
      const mp3 = join(dir, "out.mp3");
      await run("ffmpeg", ["-loglevel", "error", "-y", "-f", "concat", "-safe", "0", "-i", list, "-c:a", "libmp3lame", "-b:a", "128k", mp3]);
      let t = 0;
      const words = parts.map((p) => {
        const w = { text: p.original, startMs: Math.round(t * 1000), endMs: Math.round((t + p.sec - 0.06) * 1000) };
        t += p.sec;
        return w;
      });
      return { audio: readFileSync(mp3), words, durationMs: Math.round(t * 1000), billedChars: 0 };
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  }
}
