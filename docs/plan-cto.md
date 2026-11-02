# Axxen Content Factory: análisis de CTO y plan del MVP

## Contexto
Querés vender un pack de 5 Reels verticales (9:16) con la marca del cliente a **$17.800 ARS (~USD 11,35; neto ~USD 10,50)** a dueños de PyMEs, sin que toquen nada técnico. Tus objetivos son que producir cada pack cueste **menos de USD 1–1,50**, que ningún gasto de GPU ocurra antes del pago y que el MVP esté vendiendo en 48 h. Este documento cubre lo que pediste en 4 puntos y define qué se programa primero. El directorio de trabajo está vacío, así que el proyecto arranca de cero.

**Resumen:** el negocio es viable y el margen supera el 90%. La condición es que la calidad salga de **plantillas determinísticas (Remotion) armadas con las fotos y el logo reales del cliente**. La IA generativa de video tiene que ser algo puntual y no la base del producto. El "Supercomputer" es una ilusión para el usuario: por detrás conviene un **pipeline fijo** y no un agente autónomo.

---

## 1. Crítica y rediseño del "Motor Supercomputer"

### 1.1 Correcciones al documento original
| Lo que dice el doc | Problema | Lo que conviene hacer |
|---|---|---|
| Un "Agente Director" que elige modelos y herramientas (incluso por MCP) | En producción, un agente autónomo es caro, lento, inconsistente y difícil de depurar. Los MCP son para que un LLM use herramientas de forma interactiva, no para un backend | **DAG fijo** con 2 llamadas a Claude (estrategia y guiones en JSON con schema). Las decisiones de qué asset usar las toma **código**, no el LLM. Los MCP solo para *desarrollar* (Claude Code + Supabase/Railway/Playwright MCP) |
| Generar el producto/logo con IA de imagen a video | Los modelos deforman etiquetas, logos y texto. Es lo que más erosiona la confianza del comerciante | **Regla de 3 capas:** (1) fondo o escena = librería IA o clip IA *sin producto*; (2) producto = **foto real recortada** (BiRefNet/rembg) compuesta encima con movimiento de Remotion (parallax, zoom, barrido de luz, sombra); (3) logo y texto = siempre vector/tipografía de Remotion. **Ningún píxel del producto ni del logo pasa por un modelo generativo** (salvo el clip hero opcional, ver 1.3) |
| Video 4 con "testimonios" | Si la IA inventa testimonios, es publicidad engañosa (Ley 24.240 / DNU 274/2019) y Meta rechaza el anuncio | Usar solo reseñas reales: el rating de Google Maps o 1–2 reseñas que pegue el cliente. Si no hay, el video pasa a "Garantías y diferenciales". El schema obliga a que cada afirmación cite un dato de entrada (`source`) |
| "Música en tendencia" | Los audios virales tienen copyright: Meta silencia o rechaza esos anuncios | Música royalty‑free curada (20–30 temas por estado de ánimo). El tip de entrega es: "para orgánico, sumá el audio en tendencia desde la app con el volumen bajo" |
| Order bump "en la pantalla de pago de Mercado Pago" | Checkout Pro es una página hosteada por MP y no se le pueden agregar ítems | El bump va como **checkbox en nuestra página de resumen**, antes de redirigir a MP. La preferencia se crea con 1 o 2 ítems |
| Temporizador de 24 h | Si es falso, es publicidad engañosa y destruye el boca a boca | Que sea **real**: la vista previa y el precio de lanzamiento vencen de verdad (se borran los datos a las 24 h) |
| Video 5 "directo al WhatsApp" | Un video no tiene links clickeables | CTA visual con el número y un `wa.me` en el copy y la bio (incluido en el bump de textos) |
| "Todo tipo de negocio" | La librería de hooks queda superficial y la calidad promedio baja | **Lanzar con 3 rubros**: Gastronomía (hamburgueserías, pizzerías, heladerías), Indumentaria y Estética/Belleza. Es mejor tener profundidad que amplitud |
| Pack único de $17.800 | La necesidad es semanal ("resolver la grilla") y una venta única no genera LTV | Después de la entrega, upsell a un **plan mensual de 4 packs**. Ahí está el negocio real |

### 1.2 Pipeline (DAG determinístico)
```
[Ingesta] → BrandKit ──► [Estrategia: Claude] → Brief ──► [Guionista: Claude, JSON con schema] → 5 VideoSpec
                                                                     │
        ┌────────────────────────────────────────────────────────────┘
        ▼
[Router de assets (código)] → librería | foto real + movimiento | clip IA hero (1 por pack)
        ▼
[Voz: Azure TTS es‑AR + word boundaries] → captions.json (subtítulos sin Whisper)
        ▼
[Render: Remotion, 5 composiciones] → [QA: chequeos + Haiku visión] → [Revisión humana (primeras 50)] → [Entrega]
```
1. **Ingesta → `BrandKit`** (schema Zod): logo PNG transparente, paleta (node‑vibrant sobre el logo y la captura, $0), tipografía elegida de una lista curada de ~12 Google Fonts, productos `{foto, recorte, nombre, precio}`, rubro, tono, WhatsApp, reseñas reales. Para las URLs: Playwright propio, que ya está en el contenedor del worker porque Remotion necesita Chromium. Tiendanube expone JSON‑LD `Product` con precio. El scraping de Instagram (Apify, ~USD 1,5–2,6 cada 1.000 resultados) queda para la v1.1.
2. **Estrategia (Claude):** genera el Brief (comprador ideal, dolor, oferta, diferenciales verificables, objeciones). Tiene prohibido inventar: cada afirmación lleva `source`.
3. **Guionista (Claude, structured outputs):** produce 5 `VideoSpec` con `templateId`, `hook` (adaptado de un **banco de hooks por rubro** en rioplatense con voseo), `scenes[]` (`ai_broll | product_hero | product_grid | text_punch | price_card | review_card | cta`, con `maxLength` en cada texto para que nunca desborde), `voiceover`, `musicMood`, `voice` (alterna masculina y femenina) y `captionStyle`. Además, el código valida que no se repitan hooks ni la primera frase entre los 5.
4. **Router de assets (código, no LLM):** busca un clip de la librería por tags (`rubro, mood, duración`) a costo $0. El producto va siempre con su foto real y movimiento de Remotion ($0). Hay un solo clip IA por cliente, en el Video 1, con tope de costo.
5. **Voz:** Azure Speech `es-AR-ElenaNeural` / `es-AR-TomasNeural` con SSML. Antes del TTS se normalizan números y precios ("$17.800" pasa a "diecisiete mil ochocientos pesos"). Los eventos de *word boundary* dan los tiempos por palabra, con lo que los subtítulos estilo Hormozi salen exactos y gratis.
6. **Render:** 5 composiciones de Remotion. Respetan las safe zones de Reels (sin texto en los ~220 px superiores ni en los ~420 px inferiores), usan `fitText` y los colores de la marca, y bajan la música bajo la voz. Después, ffmpeg normaliza a −14 LUFS. Salida: H.264 1080×1920 30 fps más una portada por video.
7. **QA:** chequeos automáticos (duración, frames negros, picos de audio) más Claude Haiku 5.5 con visión sobre 3 keyframes por video ("¿texto cortado? ¿logo visible? ¿producto raro?"). Para las **primeras 50 órdenes hay revisión humana obligatoria** con un botón de aprobar en el admin (~5 min por pack). Ese es el seguro de calidad de la validación. La promesa de entrega es "en menos de 2 h", no "al instante".

### 1.3 Las 5 plantillas (variedad garantizada por estructura, no por suerte)
| # | Plantilla | Estructura | Duración |
|---|---|---|---|
| 1 | Thumb‑stopper | Clip IA hero (0–2 s) → *crossfade al producto real* → oferta → CTA | 12–18 s |
| 2 | PAS | Texto‑golpe con el dolor → B‑roll de la librería → producto como solución → CTA | 20–30 s |
| 3 | Showcase | Cortes al beat (0,4–0,6 s) por todos los productos, precio, badge de cuotas | 12–20 s |
| 4 | Autoridad | Diferenciales → tarjeta de reseña real con estrellas → garantía | 20–30 s |
| 5 | Oferta relámpago | Precio tachado → cuenta regresiva visual → CTA con el número de WhatsApp | 10–15 s |

Clip hero del Video 1: imagen a video sobre una **composición** (foto real recortada sobre la escena), con un prompt de "producto estático, solo movimiento de cámara". El clip cierra en un crossfade a la composición real, así que el "reveal" siempre muestra el producto verdadero.

### 1.4 La vista previa gratis cuesta $0 de GPU
Las **mismas composiciones de Remotion** corren en el navegador con `@remotion/player`. El lead ve sus 5 videos animados con su logo, sus fotos y hooks de la librería en baja resolución, con marca de agua, sin voz y con el final difuminado. El render lo hace la CPU del lead, así que el costo de servidor es $0. Eso materializa el efecto IKEA y cumple la regla anti‑fuga. El único costo previo al pago es el LLM de la vista previa (ver 3.2).

---

## 2. Stack, modelos y APIs (calidad vs. margen)

| Capa | Elección | Por qué |
|---|---|---|
| Web | Next.js (App Router) + Tailwind + `@remotion/player` | Tu stack. La vista previa usa el mismo código que el render final |
| DB/Auth | Supabase (Free) + Drizzle | Leads, órdenes, jobs y ledger de costos. Una cola simple con `FOR UPDATE SKIP LOCKED` |
| Storage | Cloudflare R2 (10 GB gratis, sin cargo por egreso) | Los videos se descargan muchas veces |
| Hosting | **Railway** para web y worker (Docker con Chromium) | Factura por uso: renderizar un pack cuesta ~USD 0,03 y el worker inactivo, centavos. **Vercel Hobby prohíbe uso comercial**, así que ahí habría que pagar Pro a USD 20 |
| Render | **Remotion** (`@remotion/renderer` en el worker) | Gratis con ≤3 empleados. Se descartan FFmpeg puro (animaciones pobres y subtítulos difíciles) y Shotstack/Creatomate (~USD 0,20–0,40 por minuto, que se comen el margen) |
| LLM director (post‑pago) | **Claude Opus 5.5** (`claude-opus-5-5`, USD 4/20 por MTok), effort `medium`, `output_config.format` con schema Zod, prompt caching del system prompt y del banco de hooks | Es donde la calidad del guion vende. ~USD 0,24 por pack, pagado con tus créditos |
| LLM vista previa y QA (pre‑pago) | **Claude Haiku 5.5** (`claude-haiku-5-5`, USD 0,10/0,50 por MTok) | ~USD 0,003 por lead. Con Opus serían ~USD 0,19 por lead, **unos USD 6 por venta** con una conversión del 3%. *Es una recomendación de costo y la decisión es tuya* |
| Clip IA hero | fal.ai (`@fal-ai/client`). Candidatos baratos para el bake‑off: Hailuo 02 Standard (~USD 0,045/s, 768p), Veo 3.1 Lite (~USD 0,05/s, 720p, vía Gemini API) y Wan 3.0 720p (~USD 0,10/s). Premium para VIP: Kling 3.0 Pro (~USD 0,112/s) | Un clip de 5–6 s cuesta ~USD 0,25–0,50. Se elige el ganador con fotos reales, no por benchmark |
| Recorte de producto | BiRefNet en fal (~USD 0,002 por imagen) o `rembg` local ($0) | Es la base de la regla anti‑deformación |
| TTS | **Azure Speech es‑AR** (~USD 15 por 1M de caracteres, **500K caracteres gratis por mes**, ≈250 packs) | Oficial (edge‑tts es un uso no autorizado del endpoint de Edge), con acento rioplatense y tiempos por palabra. ElevenLabs Flash (~USD 0,05 cada 1K caracteres) se prueba en A/B ciego el día 0 |
| Música | Librería royalty‑free curada | Costo marginal $0 y sin riesgo de copyright en pauta |
| Pagos | Mercado Pago Checkout Pro + webhook, verificando el pago por API antes de encolar | Idempotente frente a notificaciones duplicadas |
| Email y errores | Resend (Free) + Sentry (Free) | Entrega con links firmados de R2 |
| Píxel | Meta Pixel + Conversions API (ViewContent, Lead, InitiateCheckout, Purchase) | Sin esto, la pauta no optimiza |

### Uso de los 1.000 créditos de Google Flow por mes (renuevan cada mes)
- **Costo real:** Veo 3.1 Fast = 20 créditos por clip de 8 s, o sea **~50 clips por mes**. Quality = 100 créditos (10 clips): no vale la pena.
- **Flow no tiene API**, así que no puede entrar al pipeline automático (automatizar la UI viola los términos y se rompe). Se usa para:
  - **30 clips por mes para la librería:** 3 rubros × 10 escenas *sin producto* (parrilla con fuego, podio de lujo con niebla, perchero con neones urbanos…). Cada clip de 8 s rinde 2–3 cortes de hook, así que salen **60–90 segmentos reutilizables** por mes que se etiquetan en la tabla `library_clips`.
  - **20 clips por mes para la pauta de Axxen:** solo los 2 primeros segundos de impacto. El cuerpo del anuncio tiene que mostrar **videos reales que el sistema generó para comercios reales**, que es la mejor prueba.
- **Verificar antes de usar:** si tu cuenta Pro en Argentina pone marca de agua visible (las fuentes difieren; SynthID invisible siempre está) y qué permiten los términos comerciales. Si la marca de agua visible es obligatoria, Flow queda solo para la pauta propia y la librería se genera en fal (30 clips × 5 s × USD 0,10 ≈ USD 15).

---

## 3. Costos exactos y la inversión mínima

### 3.1 COGS por pack pagado (USD)
| Concepto | Herramienta | Costo |
|---|---|---|
| Estrategia y 5 guiones (~10K tokens de entrada, ~10K de salida) | Opus 5.5 | 0,24 *(créditos)* |
| QA visual (15 frames) | Haiku 5.5 | 0,003 |
| Recorte de 5 fotos | BiRefNet / rembg | 0,00–0,01 |
| 1 clip IA hero (5–6 s) | ganador del bake‑off | 0,25–0,50 |
| Hooks y B‑roll | librería de Flow | 0,00 |
| Voz de 5 videos (~2.000 caracteres) | Azure es‑AR | 0,00 (free tier) / 0,03 |
| Subtítulos | word boundaries | 0,00 |
| Música | librería | 0,00 |
| Render de 5 videos (~10 min de CPU) | Remotion en Railway | ~0,03–0,05 |
| Storage y entrega | R2 + Resend | 0,00 |
| **Total en efectivo** | | **~0,30–0,60** |
| **Total con Claude a precio de lista** | | **~0,55–0,85** |

### 3.2 Costo de los leads gratis (antes del pago)
La vista previa con Haiku cuesta ~USD 0,003 por lead y el Player corre en el navegador ($0). El scraping de Instagram, cuando llegue, va *después* de la entrevista (solo leads con intención) a ~USD 0,01–0,02. Con 3% de conversión de lead a venta, eso suma **≈USD 0,10–0,70 por venta**. Captcha y límite por IP y por teléfono.

### 3.3 Unit economics
- **Costo total por venta, incluyendo leads: ≤ USD 1,05–1,50.** Neto por venta: USD 10,50 − 1,05 ≈ **USD 9,45 (~90%) ≈ $14.800 ARS**.
- **Order bump:** recomiendo testear **$5.900 ARS** contra $8.500. Un bump de 48% del ticket suele convertir poco y el rango típico es 20–40%. Que incluya algo con valor real para quien pauta: los 5 copies con CTA de `wa.me`, el calendario de publicación, **2 variantes extra del hook para A/B en Meta Ads** (salen de Remotion por ~USD 0,02) y prioridad real en la cola. Costo ~USD 0,05 y margen ~99%.

### 3.4 Presupuesto mínimo estricto para las primeras 30–50 ventas
| Ítem | USD |
|---|---|
| Dominio | 5–12 |
| Railway (web + worker), 1–2 meses | 10–20 |
| Crédito en fal.ai (bake‑off ~10 + 50 packs × ~0,40) | 30 |
| ElevenLabs Starter, *solo si gana el test ciego frente a Azure* | 0–6 por mes |
| Supabase, R2, Resend, Sentry, Remotion (planes gratuitos) | 0 |
| Claude (créditos) y Google AI Pro (ya pagado) | 0 |
| **Subtotal técnico** | **~50–70** |
| Test de pauta en Meta (recién después de ~10 ventas orgánicas) | 150 |
| **Total** | **~200–220** |

Cuarenta ventas facturan ≈ USD 420 netos más los bumps, así que el punto de equilibrio llega cerca de la venta 20.

**Lo indispensable (con transparencia):** **no** hace falta pagar un modelo de video premium por cliente. La calidad sale de las plantillas, de usar el producto real y de una buena voz. Las únicas inversiones que considero indispensables son:
1. **~USD 10 de bake‑off** para elegir el modelo de imagen a video con fotos reales.
2. **Una voz que no suene a robot.** Si Azure pierde el test ciego, pagar ElevenLabs Starter (USD 6 por mes).
3. **~USD 150 de pauta** para medir el canal pago. Esto viene *después* de conseguir las primeras 10–15 ventas con prospección directa ($0): elegís 100 comercios locales en Instagram, les armás una vista previa gratis con su logo y sus fotos (costo $0) y se la mandás por DM o WhatsApp. Las cifras de CAC de pauta (CPC ~USD 0,08–0,20 y conversión de 1–2% de click a compra, que dan un CAC de ~USD 5–15) son **hipótesis que hay que medir**, no datos.

---

## 4. Arquitectura del MVP paso a paso

### 4.1 Estructura del monorepo (pnpm workspaces)
```
apps/web        Next.js: landing, entrevista, upload, vista previa (Player), checkout, admin, descarga
apps/worker     Node/TS en Docker con Chromium: cola de jobs, pipeline, render, QA
packages/core   Schemas Zod (BrandKit, Brief, VideoSpec), prompts, banco de hooks, precios, cost ledger
packages/video  5 composiciones de Remotion + componentes (Captions, PriceCard, ReviewCard, SafeZone)
                → se usan en apps/web (Player) y en apps/worker (renderer): una sola fuente de verdad
```
Tablas (Drizzle): `leads`, `brands`, `brand_assets`, `interviews`, `previews`, `orders`, `payments`, `jobs` (step, status, attempts, idempotency_key), `videos`, `cost_ledger` (cada llamada a una API registra su costo en USD) y `library_clips` (rubro, mood, duración, url).

### 4.2 Orden de construcción (48 h)
**Día 0, antes de programar (3–4 h):** bake‑off de TTS (Azure vs. ElevenLabs, test ciego con 3 personas) y de imagen a video (3 modelos × 5 productos reales). Generar 15–20 clips de librería en Flow para los 3 rubros. Curar 20 temas de música.

| Bloque | Horas | Entregable |
|---|---|---|
| **B1: plantillas de Remotion** | 0–12 | Las 5 composiciones con props de ejemplo, safe zones, `fitText`, subtítulos por palabra y colores de marca. Es el corazón de la calidad |
| **B2: motor por CLI** | 12–20 | `packages/core` con schemas, banco de hooks (~30 por rubro, sembrado con Claude Code), prompts de estrategia y guionista (Opus 5.5 con structured outputs), router de assets, TTS de Azure y clip hero de fal detrás de un flag. Un comando lleva `fixtures/hamburgueseria/` a 5 MP4. **Camino dorado offline antes de tocar la web** |
| **B3: embudo web** | 20–32 | Landing → entrevista con 5 botones por rubro → upload de logo y fotos desde el celular → Haiku arma la vista previa → Player con marca de agua y timer real de 24 h → resumen con checkbox de bump → Checkout Pro |
| **B4: backend de órdenes** | 32–42 | Webhook de MP (verificación por API, idempotente) → `jobs` → worker en Railway (pasos idempotentes con reintentos) → R2 → **cola de revisión en el admin** → al aprobar, email con links y página de descarga |
| **B5: salida a vender** | 42–48 | 3 órdenes reales de punta a punta (pago real bajo), Pixel + CAPI, páginas legales (términos, privacidad, **botón de arrepentimiento**, Res. 424/2020) y alta en monotributo para facturar |

**Después del MVP (v1.1+):** ingesta por link de Instagram (Apify) o por web (Firecrawl branding o Playwright), entrega por WhatsApp Cloud API, plan mensual de 4 packs, factura automática (ARCA) y más rubros.

---

## 5. Claude Code en tu servidor de Railway: dónde sí y dónde no

**Respuesta corta:** técnicamente funciona y puede lograr cosas muy buenas. El problema es hacerlo **con tu cuenta de suscripción** y con un agente que **escribe código por cada pedido**: esa combinación pone el negocio en riesgo.

### 5.1 Por qué no con tu suscripción (es una regla, no una opinión)
La página oficial de legal y compliance de Claude Code ([fuente](https://code.claude.com/docs/en/legal-and-compliance)) dice:
- El login con suscripción (OAuth de Pro, Max o Ultra) es para el **uso ordinario** de Claude Code. Los límites de los planes "asumen uso individual ordinario".
- Quien construye **productos o servicios**, incluso con el Agent SDK, **debe usar una API key** de Claude Console. No se permite procesar pedidos de usuarios con credenciales de un plan de suscripción, y Anthropic puede tomar medidas **sin aviso previo**.
- Consecuencia práctica: si los pedidos de tus clientes disparan Claude Code con tu suscripción, te exponés a que suspendan la cuenta, y la fábrica se apaga con clientes que ya pagaron. Además, las ventanas de 5 h y los límites semanales cortan la producción justo en un pico de pauta.

### 5.2 La versión legal de tu idea y por qué igual no conviene por pedido
Correr el **Agent SDK** (o `claude -p`) con una **API key** en Railway es legal, se rige por los Términos Comerciales y se paga con tus créditos de Platform. Aun así, un agente que escribe o edita código de Remotion en cada pedido tiene cuatro problemas:
- **Costo:** un loop agéntico (leer archivos, escribir componentes, renderizar, mirar frames y corregir) consume del orden de 0,5–2M tokens. Eso da **~USD 1–4 por pack** según mi estimación, contra **USD 0,24** de una llamada estructurada. Rompe la meta de COGS.
- **Tiempo:** 10–30 min por pack, contra ~5–10 min del pipeline fijo.
- **Calidad variable:** cada pack es código nuevo, con bugs visuales nuevos. Así no se puede garantizar "calidad de agencia" en el pedido número 200.
- **Seguridad:** un agente con Bash que procesa textos y webs de terceros queda expuesto a *prompt injection* (una página scrapeada con instrucciones escondidas) en un servidor que tiene tus claves de MP, fal y R2.

### 5.3 El reparto correcto: Claude Code construye la fábrica y la fábrica produce los videos
| Uso | Cómo | Autenticación |
|---|---|---|
| Construir plantillas, pipeline y banco de hooks | Vos con Claude Code, de forma interactiva (en tu PC o en tu server) | Suscripción OK (uso ordinario) |
| Mejorar la fábrica cada semana | Vos con Claude Code revisando los packs rechazados en QA y mejorando las plantillas. Cada mejora sirve para *todos* los clientes futuros | Suscripción OK |
| Producción por pedido | Pipeline fijo: Claude API (structured outputs) → props JSON → Remotion | **API key** (créditos de Platform) |
| Reparar un pack que falla QA (v1.1) | Agent SDK headless y acotado: solo edita el **JSON de props** del pedido (nunca código), sin Bash ni web, con un tope de turnos y un `task_budget` | **API key** |
| Tier premium "video a medida" (v2) | Agent SDK que compone escenas solo desde los componentes ya probados de `packages/video`, con un precio que cubra USD 2–4 de costo | **API key** |

Tu servidor de Railway sirve igual: ahí corre el worker del plan (sección 4) y ahí podés trabajar con Claude Code. Usá un volumen persistente para el repo, porque el filesystem de los contenedores de Railway se borra en cada deploy.

---

## Verificación
1. **Calidad offline:** el CLI sobre 3 fixtures (uno por rubro) genera 15 MP4 válidos (1080×1920, duración dentro de rango, −14 LUFS ±1, sin texto fuera de las safe zones), revisados a mano en el celular.
2. **Test con usuarios:** 5 dueños de comercio reales ven sus 5 videos. Pregunta clave: "¿lo publicarías hoy?". La meta es ≥4 de 5 que sí.
3. **Costos:** `cost_ledger` con la suma por orden **< USD 1** en las 3 órdenes de prueba.
4. **Pagos:** usuarios de prueba de MP en sandbox. Reenviar el mismo webhook 3 veces genera 1 solo job. Un pago rechazado no encola nada.
5. **Anti‑fuga:** el flujo completo de lead sin pagar deja $0 en fal y en Azure según el ledger, y solo ~USD 0,003 en Haiku.
6. **Producción:** 3 compras reales, aprobación en el admin, email recibido y descarga OK desde el celular.

## Fuentes de precios (verificar el día de compra; varias son de terceros)
- Claude: tabla de modelos y precios del skill claude-api (caché al 2026‑10‑06)
- Video: [fal.ai — Seedance 2.0 vs Kling 3.0](https://fal.ai/learn/tools/seedance-2-0-vs-kling-3-0), [teamday.ai — FAL vs Replicate (sep 2026)](https://www.teamday.ai/blog/ai-image-video-api-providers-comparison-2026), [tryinfer — cheapest video API](https://tryinfer.com/pricing/cheapest-ai-video-api)
- Flow: [aisuites — Flow credits](https://www.aisuites.ai/insights/google-flow-credits-how-many-videos-you-get-on-free-pro-and-ultra/), [costgoat — Veo pricing](https://costgoat.com/pricing/google-veo)
- TTS: [Azure Speech pricing](https://azure.microsoft.com/pricing/details/cognitive-services/speech-services), [LiteLLM — Azure AI Speech](https://docs.litellm.ai/docs/providers/azure_ai_speech), [activepieces — ElevenLabs 2026](https://www.activepieces.com/blog/elevenlabs-pricing-2026-plans-credits-and-costs)
- Remotion: [licencia](https://www.remotion.dev/docs/license), [pricing](https://www.remotion.dev/docs/license/pricing)
- Mercado Pago: [iProfesional — comisiones (jul 2026)](https://www.iprofesional.com/tecnologia/386153-mercado-pago-que-debes-saber-sobre-comisiones-plazos-y-montos)
- Imágenes: [benchlm — Nano Banana pricing](https://benchlm.ai/media-pricing/nano-banana)
- Scraping: [Apify Instagram Profile Scraper](https://apify.com/apify/instagram-profile-scraper), [Firecrawl pricing](https://www.tinyfish.ai/blog/firecrawl-pricing)
