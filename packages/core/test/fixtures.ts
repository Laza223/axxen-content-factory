import { BrandKitSchema, VideoSpecSchema, type AssetLibrary, type VideoSpec } from "../src";

export const brand = BrandKitSchema.parse({
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

export const spec = (over: Partial<VideoSpec> = {}): VideoSpec =>
  VideoSpecSchema.parse({
    id: "v1",
    template: "thumbstopper",
    voice: { words: [] },
    captionStyle: "bold",
    scenes: [
      { type: "text_punch", durationInFrames: 60, lines: ["Uno", "Dos"], say: "Uno dos." },
      { type: "product_hero", durationInFrames: 120, productId: "doble", motion: "push", say: "Mirá esta." },
      { type: "price_card", durationInFrames: 120, productId: "doble", headline: "Precio", price: 12900, say: "A $12.900." },
      { type: "cta", durationInFrames: 90, headline: "Pedí", say: "Escribinos." },
    ],
    ...over,
  });

const lic = { source: "propio" };
export const library: AssetLibrary = {
  backgrounds: [
    { id: "calm-text", name: "a", rubros: [], moods: ["fuego"], energy: 1, brightness: "dark", textSafe: true, productSafe: false, stage: false, author: "t" },
    { id: "hot-text", name: "b", rubros: [], moods: ["fuego", "energia"], energy: 3, brightness: "dark", textSafe: true, productSafe: false, stage: false, author: "t" },
    { id: "podium", name: "c", rubros: [], moods: ["fuego"], energy: 2, brightness: "dark", textSafe: false, productSafe: true, stage: true, author: "t" },
    { id: "all-round", name: "d", rubros: [], moods: ["energia"], energy: 2, brightness: "dark", textSafe: true, productSafe: true, stage: false, author: "t" },
    { id: "beauty-only", name: "e", rubros: ["estetica"], moods: ["fuego"], energy: 2, brightness: "dark", textSafe: true, productSafe: true, stage: false, author: "t" },
  ],
  sfx: [
    { id: "whoosh-1", file: "sfx/whoosh-1.mp3", durationMs: 600, category: "whoosh", intensity: 2, rubros: [], tags: [], license: lic },
    { id: "whoosh-2", file: "sfx/whoosh-2.mp3", durationMs: 600, category: "whoosh", intensity: 2, rubros: [], tags: [], license: lic },
    { id: "impact-1", file: "sfx/impact-1.mp3", durationMs: 800, category: "impact", intensity: 2, rubros: [], tags: [], license: lic },
    { id: "cash-1", file: "sfx/cash-1.mp3", durationMs: 700, category: "cash", intensity: 2, rubros: [], tags: [], license: lic },
    { id: "cash-loud", file: "sfx/cash-loud.mp3", durationMs: 700, category: "cash", intensity: 3, rubros: [], tags: [], license: lic },
    { id: "pop-1", file: "sfx/pop-1.mp3", durationMs: 300, category: "pop", intensity: 1, rubros: [], tags: [], license: lic },
    { id: "sparkle-1", file: "sfx/sparkle-1.mp3", durationMs: 900, category: "sparkle", intensity: 1, rubros: ["estetica"], tags: [], license: lic },
  ],
  music: [
    { id: "track-hot", file: "music/hot.mp3", durationSec: 60, moods: ["fuego"], energy: 3, rubros: [], license: lic },
    { id: "track-calm", file: "music/calm.mp3", durationSec: 60, moods: ["lujo"], energy: 1, rubros: [], license: lic },
  ],
};
