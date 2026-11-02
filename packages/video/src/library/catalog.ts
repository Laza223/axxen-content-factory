import { BackgroundMetaSchema, type BackgroundMeta } from "@axxen/core";

/**
 * Metadata of every library background. Pure data (no React) so the asset router can
 * import it in Node. Each id here must have a component in ./registry.tsx — the
 * `library:check` command and a unit test enforce it.
 */
export const BACKGROUND_CATALOG: BackgroundMeta[] = [
  {
    id: "brand-aurora",
    name: "Aurora de marca",
    rubros: [],
    moods: ["fuego", "lujo", "urbano", "fresco", "calido", "energia"],
    energy: 2,
    brightness: "dark",
    textSafe: true,
    productSafe: true,
    author: "axxen",
  },
  {
    id: "spotlight-podium",
    name: "Podio con reflector",
    rubros: [],
    moods: ["lujo", "fuego", "calido", "fresco"],
    energy: 1,
    brightness: "dark",
    textSafe: false,
    productSafe: true,
    stage: true,
    author: "axxen",
  },
  {
    id: "speed-burst",
    name: "Ráfaga de velocidad",
    rubros: [],
    moods: ["energia", "urbano", "fuego"],
    energy: 3,
    brightness: "dark",
    textSafe: true,
    productSafe: false,
    author: "axxen",
  },
].map((m) => BackgroundMetaSchema.parse(m));
