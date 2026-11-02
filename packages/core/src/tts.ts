const UNITS = [
  "cero", "uno", "dos", "tres", "cuatro", "cinco", "seis", "siete", "ocho", "nueve",
  "diez", "once", "doce", "trece", "catorce", "quince", "dieciséis", "diecisiete", "dieciocho", "diecinueve",
  "veinte", "veintiuno", "veintidós", "veintitrés", "veinticuatro", "veinticinco", "veintiséis",
  "veintisiete", "veintiocho", "veintinueve",
];
const TENS = ["", "", "", "treinta", "cuarenta", "cincuenta", "sesenta", "setenta", "ochenta", "noventa"];
const HUNDREDS = [
  "", "ciento", "doscientos", "trescientos", "cuatrocientos", "quinientos",
  "seiscientos", "setecientos", "ochocientos", "novecientos",
];

/** "uno" → "un" before a noun or "mil"/"millones" (veintiuno → veintiún, treinta y uno → treinta y un). */
const apocope = (words: string): string =>
  words.replace(/veintiuno$/, "veintiún").replace(/uno$/, "un");

function below1000(n: number): string {
  if (n < 30) return UNITS[n]!;
  if (n < 100) {
    const t = Math.floor(n / 10);
    const u = n % 10;
    return u === 0 ? TENS[t]! : `${TENS[t]} y ${UNITS[u]}`;
  }
  if (n === 100) return "cien";
  const h = Math.floor(n / 100);
  const rest = n % 100;
  return rest === 0 ? HUNDREDS[h]! : `${HUNDREDS[h]} ${below1000(rest)}`;
}

/** Cardinal number in Spanish words, 0 ≤ n < 1.000.000.000. */
export function numberToSpanish(n: number): string {
  if (!Number.isInteger(n) || n < 0 || n >= 1_000_000_000) {
    throw new RangeError(`numberToSpanish supports integers 0..999999999, got ${n}`);
  }
  if (n < 1000) return below1000(n);
  const millions = Math.floor(n / 1_000_000);
  const thousands = Math.floor((n % 1_000_000) / 1000);
  const rest = n % 1000;
  const parts: string[] = [];
  if (millions > 0) parts.push(millions === 1 ? "un millón" : `${apocope(below1000(millions))} millones`);
  if (thousands > 0) parts.push(thousands === 1 ? "mil" : `${apocope(below1000(thousands))} mil`);
  if (rest > 0) parts.push(below1000(rest));
  return parts.join(" ");
}

const parseArsNumber = (raw: string): number => Number(raw.replace(/\./g, ""));

/**
 * Rewrites a voice-over script so a TTS engine reads it the way an Argentine would:
 * "$12.900" → "doce mil novecientos pesos", "20%" → "veinte por ciento", "2x1" → "dos por uno",
 * "3 cuotas" → "tres cuotas". On-screen text is never passed through this.
 */
export function normalizeForTTS(text: string): string {
  return (
    text
      // $12.900 / $ 12.900 / $1.500.000
      .replace(/\$\s?(\d{1,3}(?:\.\d{3})+|\d+)/g, (_m, num: string) => {
        const n = parseArsNumber(num);
        if (n === 1) return "un peso";
        const words = numberToSpanish(n);
        return `${n % 1_000_000 === 0 ? `${apocope(words)} de` : apocope(words)} pesos`;
      })
      .replace(/(\d+)\s?%/g, (_m, num: string) => `${numberToSpanish(Number(num))} por ciento`)
      .replace(/\b(\d+)\s?[xX]\s?(\d+)\b/g, (_m, a: string, b: string) =>
        `${numberToSpanish(Number(a))} por ${numberToSpanish(Number(b))}`)
      .replace(/(\d+)\s?hs\b/g, (_m, num: string) => `${numberToSpanish(Number(num))} horas`)
      // Remaining plain numbers, including dotted thousands.
      .replace(/\b\d{1,3}(?:\.\d{3})+\b|\b\d+\b/g, (num) => {
        const n = parseArsNumber(num);
        return n < 1_000_000_000 ? numberToSpanish(n) : num;
      })
  );
}

/** One word of the script as written ("$12.900") and as it must be spoken. */
export interface SpeechToken {
  original: string;
  spoken: string;
}

/** Characters that would need XML escaping inside SSML are spelled out or dropped. */
const ssmlSafe = (s: string): string => s.replace(/&/g, " y ").replace(/[<>]/g, " ").replace(/\s+/g, " ").trim();

export const speechTokens = (text: string): SpeechToken[] =>
  text
    .split(/\s+/)
    .filter(Boolean)
    .map((original) => ({ original, spoken: ssmlSafe(normalizeForTTS(original)) }))
    .filter((t) => t.spoken.length > 0);

/** The text to synthesize and where each token sits in it ([start, end) char offsets). */
export function speechText(tokens: SpeechToken[]): { text: string; spans: [number, number][] } {
  const spans: [number, number][] = [];
  let text = "";
  for (const t of tokens) {
    if (text) text += " ";
    spans.push([text.length, text.length + t.spoken.length]);
    text += t.spoken;
  }
  return { text, spans };
}

/** A word-boundary event from the TTS engine, with its offset in the synthesized text. */
export interface Boundary {
  textOffset: number;
  startMs: number;
  endMs: number;
}

/**
 * Maps the engine's spoken-word timings back to the script's original words, so the
 * captions show "$12.900" timed over "doce mil novecientos pesos". Tokens the engine
 * did not report (punctuation-only) get no caption word.
 */
export function alignWords(
  tokens: SpeechToken[],
  spans: [number, number][],
  boundaries: Boundary[],
): { text: string; startMs: number; endMs: number }[] {
  const words: { text: string; startMs: number; endMs: number }[] = [];
  let b = 0;
  tokens.forEach((token, i) => {
    const [start, end] = spans[i]!;
    let first: Boundary | undefined;
    let last: Boundary | undefined;
    while (b < boundaries.length && boundaries[b]!.textOffset < end) {
      if (boundaries[b]!.textOffset >= start) {
        first ??= boundaries[b];
        last = boundaries[b];
      }
      b++;
    }
    if (first && last) words.push({ text: token.original, startMs: first.startMs, endMs: last.endMs });
  });
  return words;
}
