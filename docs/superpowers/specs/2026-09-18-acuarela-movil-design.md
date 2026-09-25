# Acuarela Móvil — Diseño

**Fecha:** 2026-09-18
**Estado:** Aprobado, pendiente de plan de implementación

## Propósito

Herramienta hija de AcuarelaCRM: un **único archivo HTML** (CSS y JS incluidos),
optimizado para móvil, cuyo objetivo principal es **generar cotizaciones desde el
celular** y producir un PDF idéntico al de la aplicación original.

Contiene tres secciones: **Importar**, **Productos** y **Cotizar**.

## Decisiones tomadas

| Tema | Decisión | Razón |
|---|---|---|
| Motor PDF | Reutilizar `@react-pdf/renderer` y el componente `QuotePDFDocument` existente | Idéntico por construcción, no por imitación |
| Vuelta de datos | El móvil exporta JSON compatible con `appendAll` | El trabajo hecho en la calle no queda atrapado |
| Clientes | Buscador sobre los importados + captura libre de nuevos | Cubre los dos casos reales sin una sección completa |
| Productos | Catálogo de solo consulta | Menos código, sin conflictos al reintegrar |
| Distribución | Archivo local en el teléfono (`file://`) | Sin PC ni internet |
| Imágenes | **No se almacenan** | Petición del usuario; no afectan el PDF |
| Build | Script Node propio | Cero dependencias nuevas |
| Flujo de cotización | Asistente de 4 pasos | Pensado para cotizar de pie frente al cliente |

## Hechos verificados

Estos puntos se comprobaron durante el diseño; no son supuestos.

1. **IndexedDB funciona sobre `file://`** en el teléfono del usuario. Verificado
   con un diagnóstico ejecutado en el dispositivo real: IndexedDB y localStorage
   en verde. Esto habilita la distribución como archivo local.
2. **`appendAll` concatena a ciegas**, sin deduplicar por id
   (`src/stores/useAppStore.ts:364`). Por eso la exportación del móvil debe
   contener **solo lo nuevo**.
3. **`appendAll` ignora `quoteFormat`** del JSON entrante: solo fusiona
   `settings.messages`. Reintegrar desde el móvil no puede pisar el formato.
4. **`readBackupFile` exige** que `clients` y `projects` sean arrays
   (`src/lib/backup.ts`). Arrays vacíos son válidos.
5. **El PDF no usa imágenes de producto.** Solo logo
   (`/icon/android-icon-192x192.png`) y marca de agua (`/icon/amcdag.png`).
   Descartar imágenes no afecta la fidelidad del PDF.
6. **`DEFAULT_QUOTE_FORMAT` contiene datos bancarios reales**
   (`src/lib/constants.ts`): número de cuenta, titular y correo personal.

## Arquitectura

```
AcuarelaCRM/
├─ src/                          ← INTACTO. Solo lectura.
│  └─ lib/
│     ├─ quote-pdf-document.tsx  ← reutilizado por import
│     ├─ calc.ts                 ← reutilizado por import
│     ├─ types.ts                ← reutilizado por import
│     └─ utils.ts                ← formatCurrency, formatDate
├─ movil/
│  ├─ index.html
│  ├─ main.tsx
│  ├─ db.ts                      ← capa IndexedDB
│  ├─ import-export.ts
│  └─ ui/                        ← pantallas
├─ scripts/inline-movil.mjs
└─ dist-movil/AcuarelaMovil.html ← entregable
```

**Restricción dura:** no se modifica ningún archivo existente de `src/`, ni
`vite.config.ts`. La app móvil usa su propio `vite.movil.config.ts`. La
reutilización es por import, lo que hace imposible la deriva del PDF.

Único archivo existente que se modifica: **`package.json`**, para agregar el
script `movil`. Se hará como una línea añadida, sin tocar el resto.

### Build

`npm run movil` ejecuta:

1. `vite build` con `movil/index.html` como entrada y salida en `dist-movil/`.
2. `scripts/inline-movil.mjs`, que inyecta CSS y JS inline, y convierte logo y
   marca de agua a `data:` URI.

**Comprobación de seguridad obligatoria:** el script busca el número de cuenta de
`DEFAULT_QUOTE_FORMAT` en el HTML generado y **aborta el build** si aparece. El
`quoteFormat` debe llegar únicamente desde el JSON importado por el usuario.

## Almacenamiento

IndexedDB `acuarela-movil` (versión 1):

| Store | keyPath | Contenido |
|---|---|---|
| `clients` | `id` | Clientes, sin `photoBase64` |
| `products` | `id` | Productos, sin `imageBase64` |
| `eventTypes` | `id` | Tipos de evento |
| `quotes` | `id` | Cotizaciones |
| `meta` | `k` | `settings` y fecha de importación |
| `origen` | `id` | **Solo ids** creados en el teléfono |

Los registros se guardan con la estructura exacta de `src/lib/types.ts`, sin
campos adicionales. El marcado de "creado en el móvil" vive en el store `origen`
para que el JSON exportado sea idéntico en forma al de la app original.

**Respaldo defensivo:** la capa intenta IndexedDB y, si el navegador la bloquea,
cae a `localStorage`, y si tampoco, a memoria con aviso visible de "exporta antes
de cerrar". En el teléfono del usuario se verificó que IndexedDB funciona, así
que esta ruta no debería activarse nunca; se conserva por si cambia de dispositivo
o de navegador.

## Secciones

### Importar

Selector de archivo `.json`. Valida igual que `readBackupFile`. Descarta
`imageBase64` y `photoBase64`. Muestra un resumen del contenido cargado
(ej. "142 productos, 38 clientes, 6 tipos de evento").

Reemplaza el catálogo local (clientes, productos, tipos de evento, settings).
**Nunca borra las cotizaciones creadas en el teléfono.**

### Productos

Catálogo de solo consulta: buscador, filtro por categoría y precio según tipo de
evento vía `getProductPrice()`. Sin fotos; cada producto lleva una pastilla de
color de `PALETTE_COLORS` con su inicial.

### Cotizar

Asistente de cuatro pasos con total siempre visible:

1. **Cliente** — buscador sobre importados, u opción "Cliente nuevo"
   (solo nombre y WhatsApp).
2. **Evento** — selecciona `EventType`; determina precios y serie del folio.
3. **Productos** — buscador, cantidades, precio unitario editable.
4. **Resumen** — descuento, impuesto, anticipo, notas, vigencia.

Totales con `quoteTotals()` importado de `calc.ts`. Folio con la misma lógica que
`getNextQuoteCode()`.

Al cerrar: genera el PDF con `QuotePDFDocument` y lo comparte con el menú nativo
(Web Share API), con descarga como alternativa.

## Exportación de vuelta

```json
{
  "clients":  [solo los capturados en el móvil],
  "quotes":   [solo las creadas en el móvil],
  "projects": [], "payments": [], "eventTypes": [], "products": [],
  "settings": { "messages": {}, "quoteFormat": <el importado> }
}
```

En la PC se usa **"Agregar"** (`appendAll`) y se integra sin duplicar. `projects`
va vacío pero presente porque `readBackupFile` lo exige.

## Riesgo conocido: colisión de folios

`getNextQuoteCode()` calcula el consecutivo con las cotizaciones que conoce. Si se
cotiza en el celular y en la PC el mismo día, ambos pueden generar `CT-0042`. No
es corrupción de datos —son registros distintos— pero el folio se repite.

Mitigación: el folio se muestra **editable** en el paso Resumen, precargado con
el consecutivo calculado. Si el usuario sabe que hay riesgo de choque, lo ajusta
antes de cerrar. Se resuelve dentro del móvil porque la app de escritorio no se
modifica.

## Criterios de éxito

1. El PDF generado en el móvil es **idéntico** al de la app original para la misma
   cotización (mismo número de páginas, mismo texto extraído, mismos totales).
2. El HTML generado **no contiene** datos bancarios.
3. Un JSON exportado de la app original se importa sin errores.
4. Un JSON exportado del móvil se integra con "Agregar" sin duplicar registros.
5. La app funciona abierta como `file://` en Chrome Android, con persistencia
   entre cierres.
6. Toda la interfaz es usable con una mano en una pantalla de 360 px de ancho.

## Fuera de alcance

Clientes como sección propia, proyectos, pagos, tablero, ajustes, edición de
productos, almacenamiento de imágenes y sincronización automática.
