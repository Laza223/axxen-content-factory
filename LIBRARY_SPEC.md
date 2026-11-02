# Biblioteca de recursos: especificación

Este documento es para quien produce la biblioteca (fondos animados, efectos de sonido y música) en paralelo al motor. Si cada recurso respeta este formato, el motor lo usa solo: el **router** elige fondos y música por rubro, estado de ánimo y energía, y el **planificador de SFX** coloca cada sonido en el cuadro exacto de la animación. No hace falta tocar nada más del código.

Antes de entregar, corré `pnpm library:check` (más abajo) hasta que no muestre errores.

---

## 1. Vocabulario común

Usá exactamente estos valores. Están definidos en `packages/core/src/spec.ts`, `brand.ts` y `library.ts`.

| Campo | Valores |
|---|---|
| `rubros` | `gastronomia`, `indumentaria`, `estetica`. **Lista vacía = sirve para todos.** |
| `moods` | `fuego`, `lujo`, `urbano`, `fresco`, `calido`, `energia` |
| `energy` | `1` calmo · `2` medio · `3` frenético |
| `intensity` (SFX) | `1` sutil · `2` normal · `3` fuerte o agresivo |
| `id` | kebab-case: minúsculas, dígitos y guiones (`podio-dorado`, `whoosh-aire-02`) |

Qué energía usa cada plantilla: `thumbstopper` 2–3, `pas` 1–2, `showcase` 2–3, `autoridad` 1–2, `oferta` 2–3.
Qué mood usa cada escena: `broll` usa el que eligió el director; `price_card` y `deadline` usan `energia`; `review_card` usa `calido`; el resto usa el del rubro (gastronomía → `fuego`, indumentaria → `urbano`, estética → `lujo`).

---

## 2. Fondos animados (componentes de Remotion)

### Dónde van

1. El componente va en `packages/video/src/library/backgrounds/<NombreEnPascalCase>.tsx`.
2. Se registra en `packages/video/src/library/registry.tsx` (`id → componente`).
3. La ficha va en `packages/video/src/library/catalog.ts` (`BACKGROUND_CATALOG`).

Hay tres fondos de referencia para copiar el patrón: `BrandAurora.tsx`, `SpotlightPodium.tsx` y `SpeedBurst.tsx`.

### Props que recibe (las únicas)

```ts
// packages/video/src/library/types.ts
interface BackgroundProps {
  palette: { primary: string; secondary: string; accent: string; background: string; deep: string };
  mood: "fuego" | "lujo" | "urbano" | "fresco" | "calido" | "energia";
  durationInFrames: number; // duración de la escena que tiene detrás
  seed: string;             // para cualquier aleatoriedad
}
```

El lienzo es de 1080×1920 a 30 fps. El componente ocupa todo el cuadro (`<AbsoluteFill>`).

### Reglas obligatorias

- **Colores de la marca:** se usa `palette`. No se hardcodea una paleta, salvo neutros (negro, blanco o grises) y tintes de acento por mood.
- **Nada de texto, logos ni productos.** El texto, el logo y el producto real los pone el motor encima.
- **Determinista:** toda aleatoriedad sale de `random(\`${seed}...\`)` de `remotion`. Prohibido `Math.random()`, `Date.now()` o animaciones CSS/`setTimeout`; todo se calcula desde `useCurrentFrame()`.
- **Sin red:** no se cargan fuentes, imágenes ni scripts de internet. Si hace falta una imagen, va en `packages/video/public/library/backgrounds/` y se carga con `staticFile()`.
- **Rendimiento:** cada cuadro tiene que dibujarse en menos de ~50 ms en 4 vCPU. Evitá `filter: blur()` sobre capas grandes que cambian en cada cuadro, más de ~300 nodos DOM/SVG y `backdrop-filter`. Para borrosidad, conviene usar gradientes radiales.
- **Zonas a respetar:**
  - Si la ficha dice `productSafe: true`, el centro (x 140–940, y 250–1000) queda limpio o poco contrastado, porque ahí va el producto.
  - Si dice `textSafe: true`, la franja y 400–1100 no tiene detalles de alto contraste, porque ahí van los títulos grandes.
  - Los 220 px de arriba y los 420 px de abajo los tapa la interfaz de Instagram: no pongas nada importante ahí.

### Ficha (`catalog.ts`)

```ts
{
  id: "podio-dorado",
  name: "Podio dorado",
  rubros: ["estetica"],      // [] = todos
  moods: ["lujo", "calido"],
  energy: 1,
  brightness: "dark",       // "dark" | "light"
  textSafe: false,          // ¿aguanta títulos grandes encima?
  productSafe: true,        // ¿deja el centro libre para un producto?
  stage: true,              // ¿es un escenario para producto (podio, reflector)? opcional, por defecto false
  author: "nombre o sesión",
}
```

- Un fondo con `brightness: "light"` necesita contraste para texto blanco con sombra. Si no lo tiene, marcalo `textSafe: false`.
- `stage: true` marca los fondos que solo tienen sentido con un producto encima (un podio vacío se ve raro detrás de una reseña o de un texto). El motor los usa únicamente en escenas que muestran un producto.

---

## 3. Efectos de sonido

### Dónde van

- Archivos en `packages/video/public/library/sfx/<categoria>/<id>.mp3` (también se acepta `.wav`).
- Fichas en `packages/video/public/library/sfx/manifest.json`.

### Categorías: cuándo suena cada una

| Categoría | Cuándo la usa el motor | Duración |
|---|---|---|
| `whoosh` | Cambio de escena | 0,3–1,2 s |
| `swipe` | Cortes muy rápidos (catálogo) | 0,15–0,6 s |
| `impact` | Golpe de texto (`text_punch`) | 0,3–1,5 s |
| `pop` | Stickers, badges y el botón de WhatsApp | 0,08–0,6 s |
| `riser` | Subida antes de un reveal (estética) | 1–4 s |
| `cash` | Cuando "cae" el precio | 0,3–1,2 s |
| `ding` | Estrellas de reseña y confirmaciones | 0,2–1,2 s |
| `tick` | Reloj de "últimos días" | 0,03–0,5 s |
| `click` | Ítems de una lista | 0,03–0,3 s |
| `sparkle` | Brillo en producto (estética) | 0,3–2 s |
| `sizzle` | Ambiente de comida en el plano del producto (gastronomía) | 0,5–4 s |
| `glitch` | Acentos urbanos | 0,1–1 s |
| `shutter` | Cámara o moda en el plano del producto (indumentaria) | 0,1–0,8 s |
| `ambience` | Colchón largo bajo una escena (reservado) | 3–20 s |

Conviene tener **al menos 3 variantes por categoría**, de distintas intensidades: el motor alterna para que no suene siempre igual y usa intensidad 3 solo en las plantillas agresivas (`showcase` y `oferta`).

### Formato de audio

- MP3 de 128–192 kbps o WAV, a 44,1 o 48 kHz, mono o estéreo.
- **Sin silencio al inicio** (menos de 10 ms): el golpe tiene que coincidir con el cuadro.
- Pico máximo de **−1 dBFS** (sin clipping). Intensidades parejas dentro de cada categoría.
- Sin voces ni palabras, salvo que la ficha lo diga en `tags`.

### Ficha (`manifest.json`)

```json
{
  "version": 1,
  "items": [
    {
      "id": "pop-burbuja-01",
      "file": "library/sfx/pop/pop-burbuja-01.mp3",
      "durationMs": 220,
      "category": "pop",
      "intensity": 1,
      "rubros": [],
      "tags": ["suave", "burbuja"],
      "license": { "source": "propio" }
    }
  ]
}
```

`file` es relativo a `packages/video/public/`. `durationMs` es la duración real del archivo (el check la verifica con ±60 ms de margen).

---

## 4. Música (opcional)

- Archivos en `packages/video/public/library/music/<id>.mp3` y fichas en `packages/video/public/library/music/manifest.json`.
- Cada pista dura al menos 30 s, sin voces, mezclada para ir **debajo de la voz** (sin picos fuertes). El motor la baja automáticamente cuando habla la voz.

```json
{ "id": "funk-cocina-01", "file": "library/music/funk-cocina-01.mp3", "durationSec": 62, "bpm": 112,
  "moods": ["fuego", "calido"], "energy": 2, "rubros": ["gastronomia"], "license": { "source": "pixabay", "url": "https://..." } }
```

---

## 5. Licencias (importante)

Los videos se usan en **anuncios pagos de clientes**. Solo entran recursos que permitan uso comercial en publicidad de terceros sin pagar por uso:

- Hechos por nosotros (`"source": "propio"`), CC0 o licencias del estilo de Pixabay Content License.
- Si la licencia exige atribución, va en `license.attribution`. Mejor evitarlos.
- **Nada de música de artistas ni audios "en tendencia" de Instagram/TikTok.**
- Guardá siempre `license.url` del origen.

---

## 6. Verificación

```bash
pnpm library:check                 # valida fichas, archivos, duraciones, picos y registro de fondos
pnpm library:check --render        # además renderiza una imagen por fondo con una marca de prueba
```

El check falla si:

- un id del catálogo no tiene componente, o un componente no tiene ficha;
- una ficha no respeta el schema o hay ids repetidos;
- un archivo no existe, su duración no coincide o la duración está fuera del rango de su categoría;
- un audio supera −0,5 dBFS de pico o tiene más de 10 ms de silencio inicial.

Con `--render`, las imágenes quedan en `packages/video/out/library-check/` para revisarlas a ojo.
