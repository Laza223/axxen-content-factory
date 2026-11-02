import { describe, expect, it } from "vitest";
import { alignWords, speechText, speechTokens, type Boundary } from "../src";

describe("speech tokens and alignment", () => {
  it("spells prices out and keeps SSML-safe text", () => {
    const tokens = speechTokens("Doble & papas a $12.900.");
    expect(tokens.map((t) => t.spoken)).toEqual(["Doble", "y", "papas", "a", "doce mil novecientos pesos."]);
    const { text, spans } = speechText(tokens);
    expect(text).toBe("Doble y papas a doce mil novecientos pesos.");
    expect(text.slice(...spans[4]!)).toBe("doce mil novecientos pesos.");
  });

  it("maps several spoken words back to one caption word", () => {
    const tokens = speechTokens("Ahora a $12.900 nomás");
    const { text, spans } = speechText(tokens);
    // Fake engine: one boundary per spoken word, 300 ms each.
    const boundaries: Boundary[] = [];
    let t = 0;
    for (const m of text.matchAll(/\S+/g)) {
      boundaries.push({ textOffset: m.index!, startMs: t, endMs: t + 300 });
      t += 300;
    }
    const words = alignWords(tokens, spans, boundaries);
    expect(words.map((w) => w.text)).toEqual(["Ahora", "a", "$12.900", "nomás"]);
    expect(words[2]).toEqual({ text: "$12.900", startMs: 600, endMs: 600 + 4 * 300 });
    expect(words[3]!.startMs).toBe(1800);
  });

  it("skips tokens the engine never reported", () => {
    const tokens = speechTokens("Hola che");
    const { spans } = speechText(tokens);
    const words = alignWords(tokens, spans, [{ textOffset: 5, startMs: 400, endMs: 600 }]);
    expect(words).toEqual([{ text: "che", startMs: 400, endMs: 600 }]);
  });
});
