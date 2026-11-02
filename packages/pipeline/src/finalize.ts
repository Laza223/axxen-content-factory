import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { probeAudio } from "./media";

const run = promisify(execFile);

export const LOUDNESS = { lufs: -14, truePeak: -1.5, lra: 11 } as const;

/**
 * Makes a render Instagram-ready: H.264 yuv420p (TV range, BT.709), AAC 48 kHz,
 * loudness normalized to -14 LUFS / -1.5 dBTP with a measured two-pass loudnorm,
 * faststart for instant playback, plus a JPG cover from `coverAtSec`.
 */
export async function finalizeVideo(input: string, output: string, cover: string, coverAtSec = 1.2): Promise<void> {
  const hasAudio = (await probeAudio(input)) !== null;
  const video = [
    "-c:v", "libx264", "-preset", "medium", "-crf", "18", "-pix_fmt", "yuv420p",
    "-color_range", "tv", "-colorspace", "bt709", "-color_primaries", "bt709", "-color_trc", "bt709",
    "-movflags", "+faststart",
  ];
  if (hasAudio) {
    const { lufs, truePeak, lra } = LOUDNESS;
    const { stderr } = await run("ffmpeg", [
      "-hide_banner", "-nostats", "-i", input,
      "-af", `loudnorm=I=${lufs}:TP=${truePeak}:LRA=${lra}:print_format=json`, "-f", "null", "-",
    ]);
    const m = JSON.parse(stderr.slice(stderr.lastIndexOf("{"), stderr.lastIndexOf("}") + 1)) as Record<string, string>;
    const second =
      `loudnorm=I=${lufs}:TP=${truePeak}:LRA=${lra}:measured_I=${m.input_i}:measured_TP=${m.input_tp}` +
      `:measured_LRA=${m.input_lra}:measured_thresh=${m.input_thresh}:offset=${m.target_offset}:linear=true`;
    await run("ffmpeg", ["-loglevel", "error", "-y", "-i", input, "-af", second, ...video, "-c:a", "aac", "-b:a", "192k", "-ar", "48000", output]);
  } else {
    await run("ffmpeg", ["-loglevel", "error", "-y", "-i", input, ...video, "-an", output]);
  }
  await run("ffmpeg", ["-loglevel", "error", "-y", "-ss", String(coverAtSec), "-i", output, "-frames:v", "1", "-q:v", "3", cover]);
}
