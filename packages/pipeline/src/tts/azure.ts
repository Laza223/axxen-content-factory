import { alignWords, estimateWordTimings, speechText, speechTokens, type Boundary } from "@axxen/core";
import * as sdk from "microsoft-cognitiveservices-speech-sdk";
import type { TtsOptions, TtsProvider, TtsResult } from "./types";

const TICKS_PER_MS = 10_000;

/**
 * Azure AI Speech, es-AR neural voices, with word-boundary events for exact captions.
 * Needs AZURE_SPEECH_KEY and AZURE_SPEECH_REGION.
 */
export class AzureTts implements TtsProvider {
  readonly name = "azure-speech";

  constructor(
    private readonly key = process.env.AZURE_SPEECH_KEY,
    private readonly region = process.env.AZURE_SPEECH_REGION,
  ) {
    if (!key || !region) throw new Error("Faltan AZURE_SPEECH_KEY y AZURE_SPEECH_REGION en el entorno");
  }

  async synthesize(script: string, opts: TtsOptions): Promise<TtsResult> {
    const tokens = speechTokens(script);
    const { text, spans } = speechText(tokens);
    const prefix =
      `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="es-AR">` +
      `<voice name="${opts.voice}"><prosody rate="${opts.rate}">`;
    const ssml = `${prefix}${text}</prosody></voice></speak>`;

    const config = sdk.SpeechConfig.fromSubscription(this.key!, this.region!);
    config.speechSynthesisOutputFormat = sdk.SpeechSynthesisOutputFormat.Audio48Khz192KBitRateMonoMp3;
    // null audio config: keep the audio in memory, never play it on a device.
    const synth = new sdk.SpeechSynthesizer(config, null as unknown as sdk.AudioConfig);
    const raw: { textOffset: number; audioOffset: number; duration: number }[] = [];
    synth.wordBoundary = (_s, e) => {
      if (e.boundaryType === sdk.SpeechSynthesisBoundaryType.Word) {
        raw.push({ textOffset: e.textOffset, audioOffset: e.audioOffset, duration: e.duration });
      }
    };

    try {
      const result = await new Promise<sdk.SpeechSynthesisResult>((resolve, reject) =>
        synth.speakSsmlAsync(ssml, resolve, (e) => reject(new Error(String(e)))),
      );
      if (result.reason !== sdk.ResultReason.SynthesizingAudioCompleted) {
        const details = sdk.CancellationDetails.fromResult(result as unknown as sdk.SpeechSynthesisResult);
        throw new Error(`Azure TTS cancelado: ${details.errorDetails ?? result.reason}`);
      }
      const durationMs = result.audioDuration / TICKS_PER_MS;
      // Offsets are reported against the SSML document; normalize to the plain text.
      const base = raw.length > 0 && raw[0]!.textOffset >= prefix.length ? prefix.length : 0;
      const boundaries: Boundary[] = raw.map((r) => ({
        textOffset: r.textOffset - base,
        startMs: r.audioOffset / TICKS_PER_MS,
        endMs: (r.audioOffset + r.duration) / TICKS_PER_MS,
      }));
      let words = alignWords(tokens, spans, boundaries);
      if (words.length === 0) {
        // No boundary events: fall back to estimated timings stretched to the real audio.
        words = estimateWordTimings(script, { startMs: 0, fitWithinMs: durationMs });
      }
      return { audio: Buffer.from(result.audioData), words, durationMs, billedChars: ssml.length };
    } finally {
      synth.close();
    }
  }
}
