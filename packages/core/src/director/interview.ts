import { z } from "zod";
import type { Rubro } from "../brand";

/** The quick buttons the owner taps in the 60-second interview (web, Block 3). */
export const OBJECTIVES: Record<Rubro, { id: string; label: string }[]> = {
  gastronomia: [
    { id: "llenar-semana", label: "Llenar mesas entre semana" },
    { id: "explotar-delivery", label: "Explotar el delivery del finde" },
    { id: "lanzar-producto", label: "Lanzar un combo o producto nuevo" },
    { id: "promo-puntual", label: "Mover una promo puntual" },
    { id: "darnos-a-conocer", label: "Que nos conozca más gente del barrio" },
  ],
  indumentaria: [
    { id: "nueva-coleccion", label: "Lanzar la nueva colección" },
    { id: "liquidacion", label: "Liquidar temporada" },
    { id: "producto-estrella", label: "Vender más de un producto estrella" },
    { id: "promo-puntual", label: "Mover una promo puntual" },
    { id: "darnos-a-conocer", label: "Que nos conozca más gente" },
  ],
  estetica: [
    { id: "llenar-agenda", label: "Llenar la agenda de turnos" },
    { id: "tratamiento-nuevo", label: "Lanzar un tratamiento nuevo" },
    { id: "promo-puntual", label: "Mover una promo puntual" },
    { id: "fidelizar", label: "Que vuelvan las clientas de siempre" },
    { id: "darnos-a-conocer", label: "Que nos conozca más gente" },
  ],
};

export const TONES = ["canchero", "cercano", "premium"] as const;

export const InterviewSchema = z.object({
  objective: z.string().min(1),
  /** Free text the owner typed: what they want to push this week, in their words. */
  detail: z.string().max(400).optional(),
  tone: z.enum(TONES).default("cercano"),
});
export type Interview = z.infer<typeof InterviewSchema>;

export const objectiveLabel = (rubro: Rubro, id: string): string =>
  OBJECTIVES[rubro].find((o) => o.id === id)?.label ?? id;
