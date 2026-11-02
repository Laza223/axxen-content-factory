// Generates placeholder product cut-outs and a logo for the "Fuego Burgers" test brand.
// Real packs use the client's own photos; these only exist to exercise the templates.
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const out = join(dirname(fileURLToPath(import.meta.url)), "..", "public", "fixtures", "hamburgueseria");
mkdirSync(out, { recursive: true });

const defs = `
<defs>
  <linearGradient id="bunTop" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F2B25C"/><stop offset="0.6" stop-color="#D88A2E"/><stop offset="1" stop-color="#A9601C"/></linearGradient>
  <linearGradient id="bunBot" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#E9A04A"/><stop offset="1" stop-color="#9E5718"/></linearGradient>
  <linearGradient id="patty" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6B3A1E"/><stop offset="1" stop-color="#3A1C0C"/></linearGradient>
  <linearGradient id="cheese" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFD54A"/><stop offset="1" stop-color="#F5A800"/></linearGradient>
  <linearGradient id="bacon" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#B8432A"/><stop offset="0.5" stop-color="#E7826A"/><stop offset="1" stop-color="#9C3420"/></linearGradient>
  <radialGradient id="shine" cx="0.35" cy="0.25" r="0.6"><stop offset="0" stop-color="#FFFFFF" stop-opacity="0.45"/><stop offset="1" stop-color="#FFFFFF" stop-opacity="0"/></radialGradient>
</defs>`;

const seeds = Array.from({ length: 14 }, (_, i) => {
  const x = 230 + ((i * 97) % 340);
  const y = 130 + ((i * 53) % 90);
  return `<ellipse cx="${x}" cy="${y}" rx="11" ry="6" fill="#FFF3D6" transform="rotate(${(i * 37) % 60 - 30} ${x} ${y})"/>`;
}).join("");

function burger({ patties = 1, cheese = true, bacon = false, lettuce = true, tomato = true, veggie = false }) {
  const layers = [];
  let y = 520;
  layers.push(`<path d="M150 ${y} Q150 ${y + 90} 400 ${y + 90} Q650 ${y + 90} 650 ${y} Z" fill="url(#bunBot)"/>`);
  y -= 20;
  for (let i = 0; i < patties; i++) {
    const color = veggie ? "#5E7F2E" : "url(#patty)";
    layers.push(`<rect x="130" y="${y - 70}" width="540" height="80" rx="40" fill="${color}"/>`);
    for (let d = 0; d < 9; d++) layers.push(`<circle cx="${180 + d * 55}" cy="${y - 36 + ((d * 7) % 14)}" r="5" fill="#000" opacity="0.25"/>`);
    y -= 60;
    if (cheese) {
      layers.push(`<path d="M120 ${y} L680 ${y} L660 ${y + 30} L600 ${y + 30} L585 ${y + 70} L565 ${y + 30} L420 ${y + 30} L400 ${y + 85} L380 ${y + 30} L230 ${y + 30} L210 ${y + 62} L190 ${y + 30} L140 ${y + 30} Z" fill="url(#cheese)"/>`);
      y -= 12;
    }
  }
  if (bacon) {
    layers.push(`<path d="M120 ${y + 10} q45 -40 90 0 t90 0 t90 0 t90 0 t90 0 t90 0 l0 28 q-45 -40 -90 0 t-90 0 t-90 0 t-90 0 t-90 0 t-90 0 Z" fill="url(#bacon)"/>`);
    y -= 26;
  }
  if (tomato) {
    layers.push(`<ellipse cx="300" cy="${y + 4}" rx="120" ry="24" fill="#E0412B"/><ellipse cx="500" cy="${y + 4}" rx="120" ry="24" fill="#D23520"/>`);
    y -= 16;
  }
  if (lettuce) {
    layers.push(`<path d="M120 ${y + 18} q30 -34 60 0 t60 0 t60 0 t60 0 t60 0 t60 0 t60 0 t60 0 t60 0 l0 -30 l-540 0 Z" fill="#6FBF3A"/>`);
    y -= 14;
  }
  const top = y + 6;
  layers.push(`<path d="M135 ${top} Q140 ${top - 330} 400 ${top - 340} Q660 ${top - 330} 665 ${top} Z" fill="url(#bunTop)"/>`);
  layers.push(`<path d="M135 ${top} Q140 ${top - 330} 400 ${top - 340} Q660 ${top - 330} 665 ${top} Z" fill="url(#shine)"/>`);
  layers.push(`<g transform="translate(0 ${top - 300})">${seeds}</g>`);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 700" width="800" height="700">${defs}${layers.join("")}</svg>`;
}

const fries = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 700" width="800" height="700">${defs}
${Array.from({ length: 13 }, (_, i) => `<rect x="${230 + i * 27}" y="${90 + ((i * 41) % 80)}" width="34" height="330" rx="8" fill="${i % 2 ? "#FFD54A" : "#F6C342"}" transform="rotate(${(i - 6) * 3} ${250 + i * 27} 420)"/>`).join("")}
<path d="M290 260 Q400 300 510 260 L500 330 Q400 360 300 330 Z" fill="url(#cheese)"/>
<path d="M210 330 L590 330 L540 660 L260 660 Z" fill="#E63A1F"/>
<path d="M210 330 L590 330 L584 372 L216 372 Z" fill="#B82A12"/>
<text x="400" y="540" font-family="DejaVu Sans, sans-serif" font-weight="bold" font-size="64" fill="#FFF" text-anchor="middle">FUEGO</text>
</svg>`;

const logo = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 520 260" width="520" height="260">
<path d="M120 230 C40 200 50 110 110 60 C105 105 135 120 150 95 C160 60 140 30 160 10 C230 60 250 140 210 200 C200 220 170 236 120 230 Z" fill="#E63A1F"/>
<path d="M125 220 C85 200 90 150 120 120 C122 145 140 155 150 140 C165 160 170 205 125 220 Z" fill="#FFC531"/>
<text x="250" y="130" font-family="DejaVu Sans, sans-serif" font-weight="bold" font-size="76" fill="#1C1A19" textLength="250" lengthAdjust="spacingAndGlyphs">FUEGO</text>
<text x="252" y="205" font-family="DejaVu Sans, sans-serif" font-weight="bold" font-size="56" fill="#E63A1F" textLength="250" lengthAdjust="spacingAndGlyphs">BURGERS</text>
</svg>`;

const files = {
  "doble-cheddar.svg": burger({ patties: 2, cheese: true, lettuce: false, tomato: false }),
  "bacon-bbq.svg": burger({ patties: 1, cheese: true, bacon: true, tomato: false }),
  "clasica.svg": burger({ patties: 1, cheese: true }),
  "veggie.svg": burger({ patties: 1, cheese: false, veggie: true }),
  "papas-cheddar.svg": fries,
  "logo.svg": logo,
};
for (const [name, svg] of Object.entries(files)) writeFileSync(join(out, name), svg);
console.log(`wrote ${Object.keys(files).length} assets to ${out}`);
