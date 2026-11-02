// Builds public/library-sample: synthetic placeholder SFX and a music bed made with ffmpeg,
// so the pipeline can be tested before the real library exists. Not for client videos.
import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const publicDir = join(dirname(fileURLToPath(import.meta.url)), "..", "public");
const root = join(publicDir, "library-sample");
const lic = { source: "placeholder-ffmpeg" };

const sfx = [
  // id, category, intensity, seconds, ffmpeg lavfi source + filters
  ["whoosh-soft", "whoosh", 1, 0.6, "anoisesrc=d=0.6:c=pink:a=0.6,highpass=f=300,lowpass=f=3000,afade=t=in:d=0.004,afade=t=out:st=0.3:d=0.3"],
  ["whoosh-fast", "whoosh", 2, 0.45, "anoisesrc=d=0.45:c=white:a=0.5,bandpass=f=1800:width_type=h:w=1500,afade=t=in:d=0.004,afade=t=out:st=0.2:d=0.25"],
  ["swipe-1", "swipe", 2, 0.3, "anoisesrc=d=0.3:c=white:a=0.5,highpass=f=1500,afade=t=in:d=0.05,afade=t=out:st=0.1:d=0.2"],
  ["impact-thump", "impact", 2, 0.7, "sine=f=55:d=0.7,volume=2.2,afade=t=out:st=0.05:d=0.65"],
  ["impact-boom", "impact", 3, 0.9, "sine=f=42:d=0.9,volume=2.6,afade=t=out:st=0.05:d=0.85"],
  ["pop-1", "pop", 1, 0.18, "sine=f=900:d=0.18,afade=t=out:st=0.02:d=0.16"],
  ["pop-2", "pop", 2, 0.2, "sine=f=1250:d=0.2,afade=t=out:st=0.02:d=0.18"],
  ["cash-ding", "cash", 2, 0.8, "sine=f=1568:d=0.8,afade=t=out:st=0.05:d=0.75"],
  ["cash-bright", "cash", 3, 0.9, "sine=f=2093:d=0.9,afade=t=out:st=0.05:d=0.85"],
  ["ding-1", "ding", 1, 0.7, "sine=f=1318:d=0.7,afade=t=out:st=0.03:d=0.67"],
  ["tick-1", "tick", 1, 0.08, "sine=f=3000:d=0.08,afade=t=out:st=0.005:d=0.075"],
  ["click-1", "click", 1, 0.06, "sine=f=2400:d=0.06,afade=t=out:st=0.005:d=0.055"],
  ["sizzle-1", "sizzle", 1, 1.5, "anoisesrc=d=1.5:c=white:a=0.25,highpass=f=4000,afade=t=in:d=0.3,afade=t=out:st=1.0:d=0.5"],
  ["sparkle-1", "sparkle", 1, 0.9, "sine=f=2637:d=0.9,tremolo=f=18:d=0.8,afade=t=out:st=0.1:d=0.8"],
];

const items = [];
for (const [id, category, intensity, seconds, filter] of sfx) {
  const rel = `library-sample/sfx/${category}/${id}.mp3`;
  mkdirSync(join(publicDir, dirname(rel)), { recursive: true });
  execFileSync("ffmpeg", ["-loglevel", "error", "-y", "-f", "lavfi", "-i", filter, "-ar", "44100", "-ac", "1",
    "-af", "alimiter=limit=0.6,volume=0.8", "-c:a", "libmp3lame", "-b:a", "128k", join(publicDir, rel)]);
  const probed = Number(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", join(publicDir, rel)]).toString());
  items.push({ id, file: rel, durationMs: Math.round(probed * 1000), category, intensity, rubros: [], tags: ["placeholder"], license: lic });
}
mkdirSync(join(root, "sfx"), { recursive: true });
writeFileSync(join(root, "sfx", "manifest.json"), JSON.stringify({ version: 1, items }, null, 2));

// 40 s music bed: a soft chord pad with a simple pulse.
const musicRel = "library-sample/music/pad-pulse.mp3";
mkdirSync(join(publicDir, dirname(musicRel)), { recursive: true });
execFileSync("ffmpeg", ["-loglevel", "error", "-y",
  "-f", "lavfi", "-i", "sine=f=220:d=40", "-f", "lavfi", "-i", "sine=f=277.18:d=40", "-f", "lavfi", "-i", "sine=f=329.63:d=40",
  "-filter_complex", "[0][1][2]amix=inputs=3,volume=0.5,tremolo=f=2:d=0.6,afade=t=in:d=1,afade=t=out:st=38:d=2",
  "-ar", "44100", "-ac", "2", "-c:a", "libmp3lame", "-b:a", "160k", join(publicDir, musicRel)]);
mkdirSync(join(root, "music"), { recursive: true });
writeFileSync(join(root, "music", "manifest.json"), JSON.stringify({ version: 1, items: [
  { id: "pad-pulse", file: musicRel, durationSec: 40, bpm: 120, moods: ["fuego", "calido", "energia", "urbano", "lujo", "fresco"], energy: 2, rubros: [], license: lic },
] }, null, 2));
console.log(`sample library: ${items.length} sfx + 1 music bed in ${root}`);
