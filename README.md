# Axxen Content Factory

Fábrica de packs de 5 Reels (9:16) para PyMEs. Este repo contiene los **Bloques 1 y 2** del plan (`docs/plan-cto.md`):

- **Bloque 1:** plantillas de video, schemas y validaciones.
- **Bloque 2:** el motor completo, que va de los datos de la marca a 5 MP4 terminados. Lo forman el director (Claude), la voz (Azure), el selector de recursos, los efectos de sonido, el render y la terminación.

## Estructura

```
packages/core      Schemas (marca, video, biblioteca), reglas por plantilla, validador anti-invento,
                   prompts y banco de ganchos del director, selector de fondos/música, planificador
                   de SFX, tiempos de voz y subtítulos. Código puro, sin red: se puede usar en la web.
packages/video     Remotion: PackVideo, 9 tipos de escena, 5 estilos, biblioteca de fondos
                   (src/library) y la vista de control de fondos.
packages/pipeline  Node: llamada a Claude con loop de corrección, TTS (Azure / espeak de desarrollo),
                   render, terminación con ffmpeg, registro de costos y los comandos make-pack y library:check.
LIBRARY_SPEC.md    Formato que tiene que respetar la biblioteca de fondos, SFX y música.
```

## Comandos

```bash
pnpm install
pnpm test        # tests de core y pipeline
pnpm typecheck
pnpm studio      # Remotion Studio con la marca de prueba
```

Pack completo con Claude y Azure (necesita las keys, ver más abajo):

```bash
pnpm make-pack --brand ../video/public/fixtures/hamburgueseria/brand.json --interview ../video/public/fixtures/hamburgueseria/interview.json
```

Sin keys, usando la salida de ejemplo del director y la voz robótica de desarrollo. Antes hay que instalar `espeak-ng` (`apt-get install espeak-ng`) y generar la biblioteca de muestra (sonidos sintéticos, no se suben al repo):

```bash
pnpm --filter @axxen/video fixture-assets
```


```bash
pnpm make-pack --brand ../video/public/fixtures/hamburgueseria/brand.json --director-from ../video/public/fixtures/hamburgueseria/director-sample.json --tts espeak --library library,library-sample
```

Validar la biblioteca de recursos:

```bash
pnpm library:check
```

```bash
pnpm library:check --dir library-sample --render
```

Opciones de `make-pack`:

| Opción | Qué hace |
|---|---|
| `--out DIR` | Carpeta de salida |
| `--pack-id ID` | Identificador del pack |
| `--library a,b` | Carpetas de biblioteca dentro de `packages/video/public` |
| `--seed S` | Semilla para que el selector elija siempre lo mismo |
| `--only TEMPLATE` | Renderiza una sola plantilla |
| `--stills` | Solo una imagen por escena |
| `--preview` | Agrega la marca de agua de vista previa |
| `--keep-run` | No borra los archivos intermedios |
| `--model M`, `--effort E` | Modelo y esfuerzo del director (por defecto `claude-opus-5-5` y `medium`) |
| `--tts azure\|espeak\|none` | Proveedor de voz |

Cada pack deja en la carpeta de salida:

- los 5 `.mp4` (H.264 `yuv420p`, AAC 48 kHz, −14 LUFS, faststart) con su `.jpg` de portada;
- `director.json` con el brief y los guiones;
- `specs.json` con los videos finales;
- `costs.json` con el costo de APIs por paso.

## Variables de entorno

| Variable | Para qué |
|---|---|
| `ANTHROPIC_API_KEY` | Director (Claude Opus 5.5). Se crea en Claude Console. |
| `AZURE_SPEECH_KEY` y `AZURE_SPEECH_REGION` | Voz es-AR (Elena y Tomás). El plan F0 de Azure incluye 500.000 caracteres gratis por mes. |
| `REMOTION_BROWSER` | Opcional: ruta a Chrome Headless Shell para que Remotion no lo descargue. |

## Cómo funciona el motor

1. **Director** (`packages/pipeline/src/director/run.ts`): Claude recibe los datos del negocio y la entrevista y devuelve un brief y los 5 guiones en JSON con schema. Ese JSON pasa por las mismas validaciones del render: precios reales, reseñas existentes, duración por plantilla y ganchos distintos. Si algo falla, se lo devuelve al modelo con la lista de problemas, hasta 2 veces. Usa el fallback de seguridad por defecto de la API.
2. **Voz:** un clip por escena. La escena se estira a lo que dura su voz real (`applySpeechTimings`). Los subtítulos usan los tiempos por palabra del TTS mapeados a la escritura original: se lee "doce mil novecientos pesos" y se muestra "$12.900".
3. **Selector de recursos** (`routePack`): elige el fondo de cada escena por rubro, mood, energía de la plantilla y zonas libres para texto o producto, sin repetir fondos seguidos. También elige la música del pack.
4. **SFX** (`planSfx`): pone cada sonido en el beat de la animación (`BEATS` en `packages/core/src/beats.ts`), con prioridades y una separación mínima entre sonidos.
5. **Render y terminación:** Remotion renderiza y ffmpeg hace la normalización a −14 LUFS en dos pasadas, el pasaje a `yuv420p` y la portada.

Sin biblioteca, todo sigue funcionando: se usa el fondo por defecto y no hay SFX ni música.

## Reglas que el código hace cumplir

- **El producto y el logo nunca pasan por IA generativa.**
- **Nada inventado:** precios, descuentos, reseñas y fechas límite salen de los datos del dueño. Lo verifica `validateSpec` y el director tiene que corregirlo si falla.
- **Variedad:** 5 plantillas distintas y 5 aperturas distintas.
- **Safe zones de Reels** y tipografías locales (licencia OFL).
- **Voz de desarrollo:** `espeak-ng` es robótica y solo sirve para probar sincronía. Nunca va a clientes.
