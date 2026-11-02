import { z } from "zod";

export const RUBROS = ["gastronomia", "indumentaria", "estetica"] as const;
export const RubroSchema = z.enum(RUBROS);
export type Rubro = z.infer<typeof RubroSchema>;

/**
 * Curated font list. The renderer maps each key to a Google Font.
 * Keeping the list closed keeps typography on-brand and predictable.
 */
export const FONT_KEYS = [
  "anton",
  "bebas",
  "archivo-black",
  "montserrat",
  "poppins",
  "oswald",
  "playfair",
  "dm-serif",
] as const;
export const FontKeySchema = z.enum(FONT_KEYS);
export type FontKey = z.infer<typeof FontKeySchema>;

const hex = z
  .string()
  .regex(/^#[0-9a-fA-F]{6}$/, "Color must be a 6-digit hex like #FF5500");

export const BrandColorsSchema = z.object({
  primary: hex,
  secondary: hex,
  accent: hex,
  /** Main text color over `background`. */
  text: hex,
  background: hex,
});
export type BrandColors = z.infer<typeof BrandColorsSchema>;

/** An asset reference: an https URL (R2) or a path relative to the renderer's public dir. */
export const AssetSrcSchema = z.string().min(1);

export const ProductSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(40),
  /** Price in ARS, whole pesos. */
  price: z.number().int().positive().optional(),
  /** Previous price, only when the discount is real. */
  oldPrice: z.number().int().positive().optional(),
  image: AssetSrcSchema,
  /** True when `image` has a transparent background (cut out). */
  cutout: z.boolean(),
});
export type Product = z.infer<typeof ProductSchema>;

/** Only real reviews: provided by the owner or taken from a public source. Never generated. */
export const ReviewSchema = z.object({
  author: z.string().min(1).max(40),
  text: z.string().min(1).max(160),
  rating: z.number().int().min(1).max(5),
  source: z.enum(["google", "instagram", "cliente"]),
});
export type Review = z.infer<typeof ReviewSchema>;

/** The current promotion, as stated by the owner. Drives videos 1 and 5. */
export const OfferSchema = z.object({
  headline: z.string().min(1).max(60),
  /** Human deadline as the owner stated it, e.g. "Hasta el domingo 10/11". Omit if there is none. */
  deadline: z.string().max(40).optional(),
  installments: z.string().max(30).optional(),
});
export type Offer = z.infer<typeof OfferSchema>;

export const BrandKitSchema = z.object({
  name: z.string().min(1).max(40),
  rubro: RubroSchema,
  logo: AssetSrcSchema,
  colors: BrandColorsSchema,
  font: FontKeySchema,
  /** Digits only, international format without +, e.g. 5491122334455. */
  whatsapp: z.string().regex(/^\d{10,15}$/),
  instagram: z.string().max(40).optional(),
  location: z.string().max(60).optional(),
  products: z.array(ProductSchema).min(1).max(12),
  reviews: z.array(ReviewSchema).max(10).default([]),
  offer: OfferSchema.optional(),
});
export type BrandKit = z.infer<typeof BrandKitSchema>;
