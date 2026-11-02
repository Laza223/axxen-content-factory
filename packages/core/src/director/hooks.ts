import type { Rubro } from "../brand";
import type { TemplateId } from "../spec";

export interface HookFormula {
  /** The formula, with [placeholders] the director fills ONLY with the owner's data. */
  pattern: string;
  /** What it exploits: curiosidad, dolor, deseo, urgencia, prueba social... */
  angle: string;
  templates: TemplateId[];
}

/**
 * Opening formulas per business type, in Rioplatense Spanish. The director adapts them;
 * it never copies a formula that would need a fact the owner did not give.
 */
export const HOOK_BANK: Record<Rubro, HookFormula[]> = {
  gastronomia: [
    { pattern: "¿Antojo de [producto] de verdad?", angle: "deseo", templates: ["thumbstopper", "oferta"] },
    { pattern: "POV: es [día] a la noche y pediste en [negocio].", angle: "deseo", templates: ["thumbstopper", "showcase"] },
    { pattern: "Dejá de pedir [producto] que llega [problema típico].", angle: "dolor", templates: ["pas"] },
    { pattern: "¿Otra vez [dolor típico del delivery]?", angle: "dolor", templates: ["pas"] },
    { pattern: "Lo que nadie te dice de [problema típico del rubro].", angle: "curiosidad", templates: ["pas", "autoridad"] },
    { pattern: "El secreto de nuestra [producto]: [diferencial real].", angle: "curiosidad", templates: ["thumbstopper", "autoridad"] },
    { pattern: "Si sos de [zona] y todavía no probaste [producto]…", angle: "pertenencia", templates: ["thumbstopper", "autoridad"] },
    { pattern: "No pidas [producto] hasta ver esto.", angle: "curiosidad", templates: ["thumbstopper", "pas"] },
    { pattern: "Así se arma una [producto] como corresponde.", angle: "proceso", templates: ["thumbstopper", "autoridad"] },
    { pattern: "[N] razones para pedir hoy.", angle: "lógica", templates: ["autoridad"] },
    { pattern: "¿Por qué nos eligen en [zona]?", angle: "prueba social", templates: ["autoridad"] },
    { pattern: "Mirá lo que dicen los que ya la probaron.", angle: "prueba social", templates: ["autoridad"] },
    { pattern: "Elegí tu favorita.", angle: "elección", templates: ["showcase"] },
    { pattern: "Todo esto, desde [precio real más bajo].", angle: "precio", templates: ["showcase", "oferta"] },
    { pattern: "Ojo con esta promo: [oferta real].", angle: "urgencia", templates: ["oferta"] },
    { pattern: "[Día] de [promo real] en [negocio].", angle: "urgencia", templates: ["oferta"] },
    { pattern: "Últimos días para [oferta real].", angle: "escasez", templates: ["oferta"] },
    { pattern: "Probá esto y después me contás.", angle: "desafío", templates: ["thumbstopper", "showcase"] },
    { pattern: "Esto es lo que vas a pedir este finde.", angle: "anticipación", templates: ["showcase", "thumbstopper"] },
    { pattern: "Tu [comida del día] resuelta en [tiempo real de entrega].", angle: "comodidad", templates: ["pas", "oferta"] },
  ],
  indumentaria: [
    { pattern: "Llegó lo nuevo de [negocio].", angle: "novedad", templates: ["thumbstopper", "showcase"] },
    { pattern: "Esto es lo que vas a usar todo [estación].", angle: "anticipación", templates: ["thumbstopper", "showcase"] },
    { pattern: "[N] formas de combinar [prenda].", angle: "utilidad", templates: ["showcase", "autoridad"] },
    { pattern: "La prenda que te salva cualquier outfit.", angle: "deseo", templates: ["thumbstopper"] },
    { pattern: "POV: abrís el paquete de [negocio].", angle: "deseo", templates: ["thumbstopper", "showcase"] },
    { pattern: "Si te gusta [estilo], esto es para vos.", angle: "identidad", templates: ["thumbstopper", "showcase"] },
    { pattern: "Dejá de comprar ropa que [problema típico].", angle: "dolor", templates: ["pas"] },
    { pattern: "¿Te pasa que [dolor típico al comprar ropa]?", angle: "dolor", templates: ["pas"] },
    { pattern: "Lo que nadie te dice de [problema típico del rubro].", angle: "curiosidad", templates: ["pas", "autoridad"] },
    { pattern: "Elegí tu color.", angle: "elección", templates: ["showcase"] },
    { pattern: "Tu próximo básico favorito.", angle: "deseo", templates: ["thumbstopper", "showcase"] },
    { pattern: "Vestite para [ocasión].", angle: "ocasión", templates: ["thumbstopper", "showcase"] },
    { pattern: "¿Por qué nos eligen?", angle: "prueba social", templates: ["autoridad"] },
    { pattern: "Mirá lo que dicen de [negocio].", angle: "prueba social", templates: ["autoridad"] },
    { pattern: "[Diferencial real]: así trabajamos.", angle: "confianza", templates: ["autoridad"] },
    { pattern: "Precio de liquidación: [precio real].", angle: "precio", templates: ["oferta"] },
    { pattern: "[Cuotas reales] en toda la tienda.", angle: "facilidad", templates: ["oferta"] },
    { pattern: "Últimos días de [promo real].", angle: "escasez", templates: ["oferta"] },
    { pattern: "Todo esto, desde [precio real más bajo].", angle: "precio", templates: ["showcase", "oferta"] },
    { pattern: "No compres [prenda] sin ver esto.", angle: "curiosidad", templates: ["thumbstopper", "pas"] },
  ],
  estetica: [
    { pattern: "¿Te cansaste de [dolor estético común]?", angle: "dolor", templates: ["pas"] },
    { pattern: "El error que todos cometen con [cuidado].", angle: "curiosidad", templates: ["pas", "autoridad"] },
    { pattern: "Lo que nadie te cuenta de [tratamiento].", angle: "curiosidad", templates: ["pas", "autoridad"] },
    { pattern: "Regalate un rato para vos.", angle: "deseo", templates: ["thumbstopper"] },
    { pattern: "POV: salís de tu turno en [negocio].", angle: "deseo", templates: ["thumbstopper", "showcase"] },
    { pattern: "Así se vive un [tratamiento] en [negocio].", angle: "experiencia", templates: ["thumbstopper", "autoridad"] },
    { pattern: "Si estás en [zona], tenés que conocer esto.", angle: "pertenencia", templates: ["thumbstopper", "autoridad"] },
    { pattern: "Nuevo en [negocio]: [tratamiento].", angle: "novedad", templates: ["thumbstopper", "showcase"] },
    { pattern: "Tu rutina necesita esto.", angle: "deseo", templates: ["thumbstopper", "pas"] },
    { pattern: "Antes de tu [evento], hacé esto.", angle: "ocasión", templates: ["thumbstopper", "oferta"] },
    { pattern: "[N] motivos para reservar este mes.", angle: "lógica", templates: ["autoridad"] },
    { pattern: "Mirá lo que dicen nuestras clientas y clientes.", angle: "prueba social", templates: ["autoridad"] },
    { pattern: "No es magia: es [técnica o producto real].", angle: "confianza", templates: ["autoridad"] },
    { pattern: "Elegí tu tratamiento.", angle: "elección", templates: ["showcase"] },
    { pattern: "Todo esto, desde [precio real más bajo].", angle: "precio", templates: ["showcase", "oferta"] },
    { pattern: "Promo de [mes]: [oferta real].", angle: "urgencia", templates: ["oferta"] },
    { pattern: "Turnos de esta semana con [promo real].", angle: "urgencia", templates: ["oferta"] },
    { pattern: "Últimos días de [promo real].", angle: "escasez", templates: ["oferta"] },
    { pattern: "Cuidarte no tiene que ser caro: [precio real].", angle: "precio", templates: ["oferta", "showcase"] },
    { pattern: "Reservá por WhatsApp en un minuto.", angle: "comodidad", templates: ["oferta"] },
  ],
};
