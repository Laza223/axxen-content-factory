import { describe, expect, it } from "vitest";
import {
  BrandKitSchema,
  VideoSpecSchema,
  discountPercent,
  displayWhatsapp,
  estimateWordTimings,
  formatARS,
  normalizeForTTS,
  numberToSpanish,
  applySpeechTimings,
  naturalSpeechMs,
  totalFrames,
  validatePack,
  validateSpec,
  withEstimatedTimings,
  type VideoSpec,
} from "../src";

const brand = BrandKitSchema.parse({
  name: "Burger Test",
  rubro: "gastronomia",
  logo: "logo.svg",
  colors: { primary: "#E63A1F", secondary: "#1A1A1A", accent: "#FFC531", text: "#FFFFFF", background: "#120B08" },
  font: "anton",
  whatsapp: "5491122334455",
  products: [
    { id: "doble", name: "Doble Cheddar", price: 12900, oldPrice: 15900, image: "doble.svg", cutout: true },
    { id: "papas", name: "Papas", image: "papas.svg", cutout: true },
  ],
  reviews: [{ author: "Caro", text: "La mejor", rating: 5, source: "google" }],
  offer: { headline: "2x1 los martes", deadline: "Hasta el domingo" },
});

const baseSpec = (over: Partial<VideoSpec> = {}): VideoSpec =>
  VideoSpecSchema.parse({
    id: "v5",
    template: "oferta",
    voice: { words: [] },
    captionStyle: "bold",
    scenes: [
      { type: "price_card", durationInFrames: 150, productId: "doble", headline: "Doble cheddar", price: 12900, oldPrice: 15900, say: "Solo hoy, la doble a $12.900." },
      { type: "cta", durationInFrames: 120, headline: "Pedí ahora", say: "Escribinos." },
    ],
    ...over,
  });

describe("numberToSpanish", () => {
  it.each([
    [0, "cero"], [16, "dieciséis"], [21, "veintiuno"], [31, "treinta y uno"], [100, "cien"],
    [101, "ciento uno"], [999, "novecientos noventa y nueve"], [1000, "mil"], [1500, "mil quinientos"],
    [12900, "doce mil novecientos"], [21000, "veintiún mil"], [31000, "treinta y un mil"],
    [1_000_000, "un millón"], [2_500_000, "dos millones quinientos mil"],
  ])("%i → %s", (n, words) => expect(numberToSpanish(n)).toBe(words));

  it("rejects out-of-range input", () => {
    expect(() => numberToSpanish(-1)).toThrow(RangeError);
    expect(() => numberToSpanish(1.5)).toThrow(RangeError);
  });
});

describe("normalizeForTTS", () => {
  it("reads prices as pesos", () => {
    expect(normalizeForTTS("La doble a $12.900")).toBe("La doble a doce mil novecientos pesos");
    expect(normalizeForTTS("Desde $21")).toBe("Desde veintiún pesos");
    expect(normalizeForTTS("Ahorrá $1.000.000")).toBe("Ahorrá un millón de pesos");
  });
  it("reads percentages, 2x1, hours and plain numbers", () => {
    expect(normalizeForTTS("20% off y 2x1")).toBe("veinte por ciento off y dos por uno");
    expect(normalizeForTTS("Abierto 24hs, 3 cuotas")).toBe("Abierto veinticuatro horas, tres cuotas");
  });
});

describe("format", () => {
  it("formats ARS", () => {
    expect(formatARS(12900)).toBe("$12.900");
    expect(formatARS(1500000)).toBe("$1.500.000");
    expect(formatARS(950)).toBe("$950");
  });
  it("never overstates discounts", () => expect(discountPercent(12900, 15900)).toBe(18));
  it("formats WhatsApp numbers", () => {
    expect(displayWhatsapp("5491122334455")).toBe("11 2233-4455");
    expect(displayWhatsapp("5493511234567")).toBe("351 123-4567");
  });
});

describe("estimateWordTimings", () => {
  it("is monotonic and adds pauses after punctuation", () => {
    const w = estimateWordTimings("Hola, che. Vení");
    expect(w.map((x) => x.text)).toEqual(["Hola,", "che.", "Vení"]);
    expect(w[1]!.startMs - w[0]!.endMs).toBe(160);
    expect(w[2]!.startMs - w[1]!.endMs).toBe(320);
  });
  it("fits within a limit", () => {
    const w = estimateWordTimings("una frase bastante larga para comprimir en poco tiempo", { fitWithinMs: 1000 });
    expect(w.at(-1)!.endMs).toBeLessThanOrEqual(1000);
  });
});

describe("validateSpec", () => {
  it("accepts a valid spec", () => expect(validateSpec(baseSpec(), brand)).toEqual([]));

  it("rejects invented prices, discounts, reviews and deadlines", () => {
    const spec = baseSpec({
      template: "oferta",
      scenes: [
        { type: "price_card", durationInFrames: 120, productId: "doble", headline: "Promo", price: 9900, oldPrice: 19900 },
        { type: "deadline", durationInFrames: 60, headline: "Últimas horas", deadline: "Hoy" },
        { type: "cta", durationInFrames: 90, headline: "Pedí" },
      ],
    });
    const messages = validateSpec(spec, { ...brand, offer: undefined }).map((i) => i.message);
    expect(messages.some((m) => m.includes("price 9900"))).toBe(true);
    expect(messages.some((m) => m.includes("oldPrice 19900"))).toBe(true);
    expect(messages.some((m) => m.includes("no real deadline"))).toBe(true);
  });

  it("checks template structure and duration", () => {
    const spec = baseSpec({
      template: "showcase",
      scenes: [
        { type: "product_flash", durationInFrames: 30, productId: "doble", showPrice: true },
        { type: "review_card", durationInFrames: 60, reviewIndex: 3 },
      ],
    });
    const messages = validateSpec(spec, brand).map((i) => i.message);
    expect(messages).toEqual(
      expect.arrayContaining([
        expect.stringContaining("duration"),
        "last scene must be a cta",
        expect.stringContaining('"product_flash"'),
        expect.stringContaining('"review_card" not allowed'),
        expect.stringContaining("reviewIndex 3"),
      ]),
    );
  });
});

describe("validatePack", () => {
  it("requires 5 distinct templates and distinct hooks", () => {
    const a = baseSpec({ id: "a" });
    const b = baseSpec({ id: "b" });
    const messages = validatePack([a, b], brand).map((i) => i.message);
    expect(messages).toContain("a pack has exactly 5 videos, one per template");
    expect(messages.some((m) => m.startsWith("same opening as a"))).toBe(true);
  });
});

describe("per-scene speech", () => {
  it("measures the spoken form of prices", () => {
    expect(naturalSpeechMs("$12.900")).toBe(naturalSpeechMs("doce mil novecientos pesos"));
  });

  it("places estimated words inside their own scene", () => {
    const spec = withEstimatedTimings(baseSpec());
    const sceneOneEndMs = (150 / 30) * 1000;
    const escribinos = spec.voice.words.find((w) => w.text === "Escribinos.")!;
    expect(escribinos.startMs).toBeGreaterThanOrEqual(sceneOneEndMs);
    for (const w of spec.voice.words.filter((w) => w !== escribinos)) {
      expect(w.endMs).toBeLessThanOrEqual(sceneOneEndMs);
    }
  });

  it("flags a scene too short for its line", () => {
    const spec = baseSpec({
      scenes: [
        { type: "price_card", durationInFrames: 30, productId: "doble", headline: "Doble", price: 12900, say: "Una frase larguísima que no entra de ninguna manera en un segundo." },
        { type: "cta", durationInFrames: 240, headline: "Pedí" },
      ],
    });
    expect(validateSpec(spec, brand).some((i) => i.message.includes('"say" needs'))).toBe(true);
  });

  it("stretches scenes to fit real TTS and offsets word times", () => {
    const spec = baseSpec();
    const clip = [
      { text: "Solo", startMs: 0, endMs: 300 },
      { text: "hoy", startMs: 300, endMs: 6400 },
    ];
    const out = applySpeechTimings(spec, [clip, null]);
    expect(out.scenes[0]!.durationInFrames).toBe(Math.ceil(((120 + 6400 + 180) / 1000) * 30));
    expect(out.scenes[1]!.durationInFrames).toBe(120);
    expect(out.voice.words[0]!.startMs).toBe(120);
    expect(totalFrames(out)).toBeGreaterThan(totalFrames(spec));
    expect(() => applySpeechTimings(spec, [clip])).toThrow();
  });
});
