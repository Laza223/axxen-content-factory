/** "$12.900" — Argentine format, no decimals, no space after the sign. */
export function formatARS(amount: number): string {
  const n = Math.round(amount);
  const digits = Math.abs(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${n < 0 ? "-" : ""}$${digits}`;
}

/** Percentage off, rounded down so we never overstate a discount. */
export function discountPercent(price: number, oldPrice: number): number {
  if (oldPrice <= price) return 0;
  return Math.floor(((oldPrice - price) / oldPrice) * 100);
}

/**
 * On-screen WhatsApp number: 5491122334455 → "11 2233-4455", 5493511234567 → "351 123-4567".
 * Area codes vary in length (2–4 digits); 11 is special-cased, the rest use the common 3-digit form.
 */
export function displayWhatsapp(digits: string): string {
  const local = digits.startsWith("549") ? digits.slice(3) : digits.startsWith("54") ? digits.slice(2) : digits;
  if (local.length !== 10) return local;
  if (local.startsWith("11")) return `11 ${local.slice(2, 6)}-${local.slice(6)}`;
  return `${local.slice(0, 3)} ${local.slice(3, 6)}-${local.slice(6)}`;
}
