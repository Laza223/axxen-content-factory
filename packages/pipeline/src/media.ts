import { execFile } from "node:child_process";
import { promisify } from "node:util";

const run = promisify(execFile);

export async function probeDurationSec(path: string): Promise<number> {
  const { stdout } = await run("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", path]);
  return Number(stdout.trim());
}

export async function probeAudio(path: string): Promise<{ sampleRate: number; channels: number } | null> {
  const { stdout } = await run("ffprobe", [
    "-v", "error", "-select_streams", "a:0", "-show_entries", "stream=sample_rate,channels", "-of", "csv=p=0", path,
  ]);
  const [rate, channels] = stdout.trim().split(",");
  return rate ? { sampleRate: Number(rate), channels: Number(channels) } : null;
}

/** Peak level in dBFS (ffmpeg volumedetect). */
export async function peakDb(path: string): Promise<number> {
  const { stderr } = await run("ffmpeg", ["-hide_banner", "-nostats", "-i", path, "-af", "volumedetect", "-f", "null", "-"]);
  const m = /max_volume:\s*(-?[\d.]+) dB/.exec(stderr);
  return m ? Number(m[1]) : 0;
}

/** Milliseconds of leading silence below -50 dBFS. */
export async function leadingSilenceMs(path: string): Promise<number> {
  const { stderr } = await run("ffmpeg", [
    "-hide_banner", "-nostats", "-i", path, "-af", "silencedetect=noise=-50dB:d=0.005", "-f", "null", "-",
  ]);
  const m = /silence_start:\s*(-?[\d.]+)[\s\S]*?silence_end:\s*([\d.]+)/.exec(stderr);
  if (!m || Number(m[1]) > 0.001) return 0;
  return Math.round(Number(m[2]) * 1000);
}

/** Integrated loudness (LUFS) and true peak (dBTP) via ffmpeg ebur128. */
export async function loudness(path: string): Promise<{ lufs: number; truePeak: number }> {
  const { stderr } = await run("ffmpeg", ["-hide_banner", "-nostats", "-i", path, "-af", "ebur128=peak=true", "-f", "null", "-"]);
  const summary = stderr.slice(stderr.lastIndexOf("Summary:"));
  const lufs = Number(/I:\s*(-?[\d.]+) LUFS/.exec(summary)?.[1] ?? NaN);
  const truePeak = Number(/Peak:\s*(-?[\d.]+) dBFS/.exec(summary)?.[1] ?? NaN);
  return { lufs, truePeak };
}
