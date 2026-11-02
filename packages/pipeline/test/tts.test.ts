import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { CachedTts, EspeakTts, type TtsProvider } from "../src";

describe("CachedTts", () => {
  it("pays once per line", async () => {
    let calls = 0;
    const fake: TtsProvider = {
      name: "fake",
      synthesize: async (text) => {
        calls++;
        return { audio: Buffer.from(text), words: [{ text, startMs: 0, endMs: 100 }], durationMs: 100, billedChars: text.length };
      },
    };
    const tts = new CachedTts(fake, mkdtempSync(join(tmpdir(), "tts-cache-")));
    const a = await tts.synthesize("Hola", { voice: "v", rate: "0%" });
    const b = await tts.synthesize("Hola", { voice: "v", rate: "0%" });
    await tts.synthesize("Hola", { voice: "otra", rate: "0%" });
    expect(calls).toBe(2);
    expect(b.audio.toString()).toBe("Hola");
    expect(a.billedChars).toBe(4);
    expect(b.billedChars).toBe(0);
  });
});

describe("EspeakTts (dev voice)", () => {
  it("returns caption words in the script's spelling with increasing times", async () => {
    const r = await new EspeakTts().synthesize("La doble a $12.900.", { voice: "es-AR-ElenaNeural", rate: "+5%" });
    expect(r.words.map((w) => w.text)).toEqual(["La", "doble", "a", "$12.900."]);
    for (let i = 1; i < r.words.length; i++) expect(r.words[i]!.startMs).toBeGreaterThan(r.words[i - 1]!.startMs);
    // The price is spoken as four words, so it lasts much longer than "a".
    expect(r.words[3]!.endMs - r.words[3]!.startMs).toBeGreaterThan(3 * (r.words[2]!.endMs - r.words[2]!.startMs));
    expect(r.audio.length).toBeGreaterThan(1000);
  });
});
