import type { Word } from "@axxen/core";

export interface TtsOptions {
  voice: string;
  /** SSML prosody rate, e.g. "+8%". */
  rate: string;
}

export interface TtsResult {
  /** MP3 bytes. */
  audio: Buffer;
  /** Caption words with times relative to the start of `audio`, in the script's original spelling. */
  words: Word[];
  durationMs: number;
  /** Characters billed by the provider. */
  billedChars: number;
}

export interface TtsProvider {
  readonly name: string;
  synthesize(text: string, opts: TtsOptions): Promise<TtsResult>;
}

/** Rioplatense neural voices. */
export const VOICES = { female: "es-AR-ElenaNeural", male: "es-AR-TomasNeural" } as const;
