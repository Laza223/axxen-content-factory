import { FPS, sceneStarts, type VideoSpec, type Word } from "./spec";
import { normalizeForTTS } from "./tts";

export interface EstimateOptions {
  /** When the first word starts. */
  startMs?: number;
  /** Milliseconds per character of a word (≈14 chars/s, natural Rioplatense pace). */
  msPerChar?: number;
  minWordMs?: number;
  commaPauseMs?: number;
  sentencePauseMs?: number;
  /** If set, timings are compressed so the last word ends by this time. */
  fitWithinMs?: number;
}

/**
 * Estimated word timings for captions when there is no TTS audio yet (free preview,
 * fixtures). Real renders replace these with the TTS engine's word-boundary events.
 */
export function estimateWordTimings(text: string, opts: EstimateOptions = {}): Word[] {
  const {
    startMs = 250,
    msPerChar = 70,
    minWordMs = 180,
    commaPauseMs = 160,
    sentencePauseMs = 320,
    fitWithinMs,
  } = opts;
  const tokens = text.split(/\s+/).filter(Boolean);
  const words: Word[] = [];
  let t = startMs;
  for (const token of tokens) {
    // Measure the spoken form: "$12.900" is said as "doce mil novecientos pesos".
    const letters = normalizeForTTS(token).replace(/[^\p{L}\p{N}]/gu, "").length || 1;
    const dur = Math.max(minWordMs, letters * msPerChar);
    words.push({ text: token, startMs: t, endMs: t + dur });
    t += dur;
    if (/[.!?…]$/.test(token)) t += sentencePauseMs;
    else if (/[,;:]$/.test(token)) t += commaPauseMs;
  }
  const last = words.at(-1);
  if (fitWithinMs !== undefined && last && last.endMs > fitWithinMs) {
    const scale = (fitWithinMs - startMs) / (last.endMs - startMs);
    for (const w of words) {
      w.startMs = Math.round(startMs + (w.startMs - startMs) * scale);
      w.endMs = Math.round(startMs + (w.endMs - startMs) * scale);
    }
  }
  return words;
}

/** How long `text` takes to say at a natural pace, from the first word to the last. */
export const naturalSpeechMs = (text: string): number => {
  const words = estimateWordTimings(text, { startMs: 0 });
  return words.at(-1)?.endMs ?? 0;
};

/** Milliseconds of air left before the voice starts in each scene, and after it ends. */
const LEAD_IN_MS = 120;
const TAIL_MS = 180;

/**
 * Fills `voice.words` with estimated timings, scene by scene, so captions always match
 * what is on screen. Used for the free preview and fixtures; paid renders use
 * applySpeechTimings with the TTS engine's word-boundary events instead.
 */
export function withEstimatedTimings(spec: VideoSpec): VideoSpec {
  if (spec.voice.words.length > 0) return spec;
  const starts = sceneStarts(spec);
  const words = spec.scenes.flatMap((scene, i) => {
    if (!scene.say) return [];
    const startMs = (starts[i]! / FPS) * 1000 + LEAD_IN_MS;
    const endMs = ((starts[i]! + scene.durationInFrames) / FPS) * 1000 - TAIL_MS;
    return estimateWordTimings(scene.say, { startMs, fitWithinMs: endMs });
  });
  return { ...spec, voice: { ...spec.voice, words } };
}

/**
 * Applies real TTS timings. `speech[i]` holds the words of scene i's audio clip, with
 * times relative to the start of that clip (null when the scene has no `say`).
 * Scenes are stretched, never shrunk, so the voice always finishes before the cut.
 * The worker then lays each clip at its scene's start to build `voice.src`.
 */
export function applySpeechTimings(spec: VideoSpec, speech: (Word[] | null)[]): VideoSpec {
  if (speech.length !== spec.scenes.length) {
    throw new Error(`expected ${spec.scenes.length} speech entries, got ${speech.length}`);
  }
  const scenes = spec.scenes.map((scene, i) => {
    const last = speech[i]?.at(-1);
    if (!last) return scene;
    const neededFrames = Math.ceil(((LEAD_IN_MS + last.endMs + TAIL_MS) / 1000) * FPS);
    return { ...scene, durationInFrames: Math.max(scene.durationInFrames, neededFrames) };
  });
  const starts = sceneStarts({ scenes });
  const words = speech.flatMap((clip, i) => {
    const offset = (starts[i]! / FPS) * 1000 + LEAD_IN_MS;
    return (clip ?? []).map((w) => ({ text: w.text, startMs: w.startMs + offset, endMs: w.endMs + offset }));
  });
  return { ...spec, scenes, voice: { ...spec.voice, words } };
}

/** Where each scene's audio clip must start in the assembled voice track, in ms. */
export const speechClipOffsetsMs = (spec: VideoSpec): number[] =>
  sceneStarts(spec).map((f) => (f / FPS) * 1000 + LEAD_IN_MS);
