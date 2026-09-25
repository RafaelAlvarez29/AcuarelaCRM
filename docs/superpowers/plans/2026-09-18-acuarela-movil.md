# Acuarela Móvil — Plan de Implementación

> **Para trabajadores agénticos:** SUB-SKILL REQUERIDA: usar
> superpowers:subagent-driven-development o superpowers:executing-plans para
> implementar tarea por tarea. Los pasos usan checkbox (`- [ ]`).

**Goal:** Construir un único archivo HTML optimizado para móvil que importe datos
de AcuarelaCRM, consulte el catálogo de productos y genere cotizaciones con un PDF
idéntico al de la app original.

**Architecture:** Entrada de Vite independiente en `movil/` que reutiliza por
import `src/lib/quote-pdf-document.tsx`, `calc.ts`, `types.ts` y `utils.ts`. Un
script Node propio empaqueta el build en un solo `.html` con CSS, JS e imágenes
inline. Persistencia en IndexedDB con respaldo a localStorage.

**Tech Stack:** React 19, TypeScript, Vite 8, @react-pdf/renderer, IndexedDB.
Sin dependencias nuevas.

**Spec:** `docs/superpowers/specs/2026-09-18-acuarela-movil-design.md`

## Global Constraints

- **Cero dependencias nuevas.** No ejecutar `npm install <paquete>`.
- **No modificar ningún archivo de `src/`.** Solo lectura, reutilización por import.
- **No modificar `vite.config.ts`.** La app móvil usa `vite.movil.config.ts`.
- **Único archivo existente modificable:** `package.json`, para añadir el script `movil`.
- **Sin imágenes:** descartar `imageBase64` y `photoBase64` al importar.
- **Prohibido incrustar datos bancarios** en el HTML generado. El build debe abortar si aparecen.
- **Estructura de datos idéntica** a `src/lib/types.ts`. Sin campos extra en los objetos exportados.
- Español neutro en toda la interfaz. Moneda MXN vía `formatCurrency`.
- Objetivo de ancho mínimo: 360 px, usable con una mano.

## Verificación (sin framework de pruebas)

El proyecto no tiene runner de tests. Cada tarea se verifica con:

- `npx tsc -b --noEmit` — chequeo de tipos.
- `npm run movil` — build completo; debe terminar en exit 0.
- Carga del HTML resultante en Chrome y comprobación visual/funcional.
- Para el PDF: comparación real contra uno generado por la app original.

---

### Task 1: Andamiaje y empaquetado en un solo archivo

**Files:**
- Create: `vite.movil.config.ts`
- Create: `movil/index.html`
- Create: `movil/main.tsx`
- Create: `scripts/inline-movil.mjs`
- Modify: `package.json` (añadir script `movil`)

**Interfaces:**
- Produces: `npm run movil` → `dist-movil/AcuarelaMovil.html` autocontenido.

- [ ] **Step 1: Crear `vite.movil.config.ts`**

Entrada `movil/index.html`, salida `dist-movil/`, alias `@` → `./src`, mismos
plugins que el config original (react, tailwind, nodePolyfills).
`build.assetsInlineLimit` alto para que Vite ya incruste lo pequeño, y
`build.cssCodeSplit: false` para que salga una sola hoja de estilos.

- [ ] **Step 2: Crear `movil/index.html` y `movil/main.tsx` mínimos**

Un `<div id="root">` y un React que renderice el texto "Acuarela Móvil".
Meta viewport con `viewport-fit=cover` para pantallas con notch.

- [ ] **Step 3: Crear `scripts/inline-movil.mjs`**

Lee `dist-movil/index.html`, sustituye cada `<script src>` y
`<link rel=stylesheet>` por su contenido inline, convierte
`public/icon/android-icon-192x192.png` y `public/icon/amcdag.png` a `data:` URI
exportados como constantes, y escribe `dist-movil/AcuarelaMovil.html`.

Incluye la comprobación de seguridad obligatoria:

```js
const PROHIBIDO = ["4152 3143 1401 7180", "4152314314017180"]
const plano = html.replace(/\s+/g, " ")
for (const secreto of PROHIBIDO) {
  if (plano.includes(secreto)) {
    console.error("ABORTADO: el HTML generado contiene datos bancarios.")
    process.exit(1)
  }
}
```

- [ ] **Step 4: Añadir el script a `package.json`**

```json
"movil": "vite build -c vite.movil.config.ts && node scripts/inline-movil.mjs"
```

- [ ] **Step 5: Verificar**

Run: `npm run movil`
Esperado: exit 0 y `dist-movil/AcuarelaMovil.html` existente.

Confirmar que no quedan referencias a archivos externos:

```bash
grep -oE '(src|href)="[^"]*"' dist-movil/AcuarelaMovil.html | grep -v '^.*="data:' || echo "OK: todo inline"
```

Abrir el archivo en Chrome y confirmar que muestra "Acuarela Móvil".

---

### Task 2: Capa de almacenamiento

**Files:**
- Create: `movil/db.ts`

**Interfaces:**
- Consumes: tipos de `@/lib/types`.
- Produces:
  - `type NombreStore = "clients" | "products" | "eventTypes" | "quotes"`
  - `abrirDB(): Promise<void>`
  - `guardarColeccion<T>(store: NombreStore, registros: T[]): Promise<void>` — reemplaza el contenido del store
  - `leerColeccion<T>(store: NombreStore): Promise<T[]>`
  - `guardarUno<T>(store: NombreStore, registro: T): Promise<void>`
  - `leerMeta<T>(clave: string): Promise<T | null>`
  - `guardarMeta(clave: string, valor: unknown): Promise<void>`
  - `marcarOrigenMovil(id: string): Promise<void>`
  - `idsCreadosEnMovil(): Promise<Set<string>>`
  - `modoAlmacenamiento(): "indexeddb" | "localstorage" | "memoria"`

- [ ] **Step 1: Implementar la apertura con respaldo en cascada**

DB `acuarela-movil` v1, stores `clients`, `products`, `eventTypes`, `quotes`
(keyPath `id`), `meta` (keyPath `k`), `origen` (keyPath `id`).

Si `indexedDB.open` falla, se bloquea o no responde en 5 segundos, degradar a
`localStorage` bajo la clave `acuarela-movil`; si eso también falla, a un objeto
en memoria. Guardar el modo elegido para que la UI lo consulte.

- [ ] **Step 2: Verificar tipos**

Run: `npx tsc -b --noEmit`
Esperado: sin errores.

- [ ] **Step 3: Verificar en el navegador**

Añadir temporalmente en `main.tsx` una llamada que guarde y lea un registro y
muestre `modoAlmacenamiento()` en pantalla. Compilar, abrir el HTML y confirmar
que dice `indexeddb`. Quitar el código temporal antes de continuar.

---

### Task 3: Importación del JSON

**Files:**
- Create: `movil/import-export.ts`
- Create: `movil/ui/pantalla-importar.tsx`

**Interfaces:**
- Consumes: `guardarColeccion`, `guardarMeta` (Task 2).
- Produces:
  - `leerArchivoBackup(file: File): Promise<AppData | null>`
  - `despojarImagenes(data: AppData): AppData`
  - `interface ResumenImportacion { productos: number; clientes: number; tiposEvento: number; fecha: string }`
  - `importar(data: AppData): Promise<ResumenImportacion>`

- [ ] **Step 1: Implementar `leerArchivoBackup` y `despojarImagenes`**

`leerArchivoBackup` replica la validación de `src/lib/backup.ts`: acepta solo si
`Array.isArray(parsed.clients) && Array.isArray(parsed.projects)`, devuelve `null`
en cualquier otro caso.

`despojarImagenes` mapea productos a `{ ...p, imageBase64: null }` y clientes a
`{ ...c, photoBase64: null }`.

- [ ] **Step 2: Implementar `importar`**

Guarda `clients`, `products`, `eventTypes` y `settings` (este último en `meta`
bajo la clave `settings`).

**No toca el store `quotes`**: las cotizaciones creadas en el teléfono se
conservan siempre. Guarda la fecha de importación en `meta` bajo `importadoEl`.

- [ ] **Step 3: Construir la pantalla**

`<input type="file" accept="application/json">` disparado por un botón grande.
Tras importar, mostrar el resumen y la fecha de la última importación. Si el
archivo es inválido, mensaje claro: "Ese archivo no es un respaldo de
AcuarelaCRM."

- [ ] **Step 4: Verificar con datos reales**

Exportar un JSON desde la app original (`npm run dev` → Datos → descargar
respaldo), importarlo en el HTML móvil y confirmar que los conteos del resumen
coinciden con los del archivo:

```bash
node -e "const d=require('./DataAcuarelaCRM_XXX.json');console.log(d.products.length,d.clients.length,d.eventTypes.length)"
```

---

### Task 4: Catálogo de productos

**Files:**
- Create: `movil/ui/pantalla-productos.tsx`
- Create: `movil/ui/pastilla-color.tsx`

**Interfaces:**
- Consumes: `leerColeccion` (Task 2), `getProductPrice` de `@/lib/calc`,
  `PALETTE_COLORS` de `@/lib/constants`.
- Produces: `<PantallaProductos />`, `<PastillaColor id={string} nombre={string} />`

- [ ] **Step 1: Pastilla de color**

Sustituye a la foto. Cuadro redondeado con color **determinista** derivado del
`id` del producto (suma de códigos de carácter módulo la longitud de
`PALETTE_COLORS`), con la inicial del nombre en mayúscula.

Determinista a propósito: `getPaletteColor()` del proyecto original es aleatorio y
cambiaría en cada recarga.

- [ ] **Step 2: Lista con buscador y filtro**

Buscador por nombre y descripción. Filtro por categoría con chips horizontales
deslizables. Mostrar precio base y, si hay tipo de evento seleccionado, el precio
correspondiente vía `getProductPrice(producto, eventTypeId)`.

Solo productos con `isActive === true`.

- [ ] **Step 3: Verificar**

Run: `npm run movil`. Abrir, buscar un producto conocido del JSON importado y
confirmar que el precio mostrado coincide con el de la app original.

---

### Task 5: Asistente de cotización, pasos Cliente y Evento

**Files:**
- Create: `movil/folio.ts`
- Create: `movil/ui/asistente.tsx`
- Create: `movil/ui/paso-cliente.tsx`
- Create: `movil/ui/paso-evento.tsx`

**Interfaces:**
- Consumes: `leerColeccion`, `guardarUno`, `marcarOrigenMovil` (Task 2),
  `quoteTotals` de `@/lib/calc`.
- Produces:
  - `siguienteFolio(quotes: Quote[], series?: string | null): string`
  - `interface BorradorCotizacion { clientId: string | null; clientName: string; clientPhone: string; clientEmail: string | null; eventTypeId: string | null; eventTypeName: string | null; items: QuoteItem[]; discountType: QuoteDiscountType; discountValue: number; taxRate: number; deposit: number | null; notes: string | null; code: string; validUntil: string | null }`
  - `<Asistente />`

- [ ] **Step 1: Implementar `siguienteFolio` en `movil/folio.ts`**

Se necesita ya en el paso Evento, porque la serie del tipo de evento cambia el
prefijo del folio. Réplica exacta de `getNextQuoteCode`
(`src/stores/useAppStore.ts:109`):

```ts
export function siguienteFolio(quotes: Quote[], series?: string | null): string {
  const prefijo = series && series.trim() ? series.trim().toUpperCase() : "CT"
  let max = 0
  for (const q of quotes) {
    if (q.code.startsWith(`${prefijo}-`)) {
      const n = Number.parseInt(q.code.slice(prefijo.length + 1), 10)
      if (Number.isFinite(n)) max = Math.max(max, n)
    }
  }
  return `${prefijo}-${String(max + 1).padStart(4, "0")}`
}
```

- [ ] **Step 2: Contenedor del asistente**

Indicador de 4 pasos arriba, contenido en medio, barra fija abajo con el total
calculado por `quoteTotals(borrador)` y el botón de avance. Botón de retroceso en
cada paso. El borrador vive en estado de React hasta el paso final.

- [ ] **Step 3: Paso Cliente**

Buscador sobre los clientes importados, filtrando por nombre y por
`whatsapp_number`. Opción "+ Cliente nuevo" que pide solo nombre y WhatsApp.

Al crear uno nuevo: generar el id con `crypto.randomUUID()` (igual que `uid()` de
`src/lib/utils.ts`), construir un `Client` completo con `creationDate` en ISO e
`isActive: true`, guardarlo con `guardarUno("clients", cliente)` y registrarlo con
`marcarOrigenMovil(id)`.

- [ ] **Step 4: Paso Evento**

Lista de `eventTypes` con `isActive === true`, más una opción "General" que deja
`eventTypeId` en `null` y `eventTypeName` en `null`.

Al elegir, guardar `eventTypeId` y `eventTypeName` y recalcular el folio con la
serie del evento.

- [ ] **Step 5: Verificar**

Compilar, recorrer ambos pasos y confirmar que al elegir un tipo de evento con
`series` definida el folio cambia de prefijo (por ejemplo `CT-0001` → `BOD-0001`).

---

### Task 6: Pasos Productos y Resumen

**Files:**
- Create: `movil/ui/paso-productos.tsx`
- Create: `movil/ui/paso-resumen.tsx`

**Interfaces:**
- Consumes: `getProductPrice`, `quoteTotals` de `@/lib/calc`, `formatCurrency` de `@/lib/utils`.
- Consumes: `siguienteFolio` de `movil/folio.ts` (Task 5).
- Produces: `<PasoProductos />`, `<PasoResumen />`

- [ ] **Step 1: Paso Productos**

Buscador igual al del catálogo. Al tocar un producto se agrega como `QuoteItem`
con `unitPrice` de `getProductPrice(producto, eventTypeId)` y `quantity: 1`.

Controles `-` / cantidad / `+` de al menos 44 px de alto. Precio unitario
editable por si hay que ajustarlo en el momento. Permite agregar un concepto
libre sin producto asociado (`productId: null`).

- [ ] **Step 2: Paso Resumen**

Campos: folio **editable** (precargado con `siguienteFolio`), tipo y valor de
descuento, tasa de impuesto, anticipo, notas y vigencia. Desglose calculado con
`quoteTotals`, mostrando descuento e impuesto solo si aplican (misma condición
que el PDF: `discount > 0.004` y `taxRate > 0`).

Botón final "Generar cotización": construye el `Quote` completo con
`createdAt` en ISO y `status: "Borrador"`, lo guarda con
`guardarUno("quotes", cotizacion)` y lo registra con `marcarOrigenMovil(id)`.

- [ ] **Step 3: Verificar los números**

Crear la misma cotización en la app original y en el móvil, con los mismos
productos, descuento e impuesto. Comparar subtotal, descuento, impuesto y total.
Deben coincidir al centavo, porque ambos usan el mismo `quoteTotals`.

---

### Task 7: Generación del PDF y compartir

**Files:**
- Create: `movil/pdf.ts`
- Modify: `movil/ui/paso-resumen.tsx` (enganchar el botón final)

**Interfaces:**
- Consumes: `QuotePDFDocument` de `@/lib/quote-pdf-document`, y las constantes
  base64 del logo y la marca de agua generadas en Task 1.
- Produces:
  - `generarPdfBlob(quote: Quote, quoteFormat: QuoteFormatSettings): Promise<Blob>`
  - `compartirPdf(blob: Blob, quote: Quote): Promise<void>`

- [ ] **Step 1: Implementar `generarPdfBlob`**

Usa `pdf(<QuotePDFDocument ... />).toBlob()` igual que `src/lib/quote-pdf.tsx`,
con una diferencia obligatoria: el logo y la marca de agua se pasan desde las
constantes base64 incrustadas, **no** con `loadLogoAsDataUri`, porque en `file://`
no hay servidor del cual hacer `fetch`.

- [ ] **Step 2: Implementar `compartirPdf`**

Si `navigator.canShare?.({ files: [archivo] })` es verdadero, usar
`navigator.share`. Si no, caer a descarga con `<a download>`.

Nombre del archivo idéntico al de la app original:
`quote.code.replace(/[^a-zA-Z0-9_-]/g, "_") + ".pdf"`.

- [ ] **Step 3: Verificar fidelidad — criterio central**

Generar en la app original el PDF de una cotización y en el móvil el de una
cotización con exactamente los mismos datos. Comparar:

- número de páginas
- texto extraído de ambos (deben coincidir, salvo el folio si difiere)
- posición visual de logo, marca de agua, tabla, totales y banda de pie

Si aparecen diferencias, la causa más probable es el origen de las imágenes:
verificar que el base64 incrustado corresponda exactamente a
`public/icon/android-icon-192x192.png` y `public/icon/amcdag.png`.

---

### Task 8: Exportación de vuelta

**Files:**
- Modify: `movil/import-export.ts`
- Create: `movil/ui/pantalla-exportar.tsx`

**Interfaces:**
- Consumes: `idsCreadosEnMovil`, `leerColeccion`, `leerMeta` (Task 2).
- Produces: `construirExportacion(): Promise<AppData>`, `descargarExportacion(): Promise<void>`

- [ ] **Step 1: Implementar `construirExportacion`**

Lee `idsCreadosEnMovil()` y filtra. Devuelve **solo lo nuevo**:

```ts
{
  clients:  clientesNuevos,
  quotes:   cotizacionesNuevas,
  projects: [],
  payments: [],
  eventTypes: [],
  products: [],
  settings: { messages: {}, quoteFormat: formatoImportado },
}
```

`projects` va vacío pero presente: `readBackupFile` de la app original exige que
sea un array. `products` vacío es lo que evita la duplicación del catálogo, ya
que `appendAll` concatena a ciegas.

- [ ] **Step 2: Pantalla de exportar**

Muestra cuántas cotizaciones y clientes nuevos hay pendientes de reintegrar.
Botón que comparte o descarga el JSON con nombre `AcuarelaMovil_YYYYMMDD.json`.

Instrucción visible en pantalla: *"En la PC, usa Datos → Importar → Agregar."*

- [ ] **Step 3: Verificar el reintegro — criterio central**

Exportar del móvil, importar en la app original con **"Agregar"**, y confirmar:

- las cotizaciones nuevas aparecen en la lista
- el catálogo de productos NO se duplicó
- el formato de cotización de la PC no cambió

---

### Task 9: Navegación, pulido móvil y verificación final

**Files:**
- Create: `movil/ui/navegacion.tsx`
- Modify: `movil/main.tsx`

- [ ] **Step 1: Navegación inferior**

Tres pestañas: Cotizar, Productos, Datos. Barra inferior fija con
`padding-bottom: env(safe-area-inset-bottom)` para no quedar bajo la barra
gestual. Objetivos táctiles de 44 px como mínimo.

- [ ] **Step 2: Identidad visual**

Colores de `BRAND_COLORS` y `PALETTE_COLORS` de `@/lib/constants`. Modo claro y
oscuro con `prefers-color-scheme`. Tipografía del sistema (`system-ui`), sin
fuentes externas: no hay red en `file://`.

- [ ] **Step 3: Estados vacíos**

Sin datos importados, la pestaña Cotizar no muestra un formulario vacío sino una
invitación a importar, con un botón que lleva directo a la pantalla de
importación.

- [ ] **Step 4: Verificación final contra los criterios de éxito de la spec**

Recorrer los seis criterios uno por uno y dejar constancia del resultado:

1. El PDF del móvil es idéntico al de la app original
2. El HTML no contiene datos bancarios
3. Importa sin errores un JSON exportado de la app original
4. Su exportación se integra con "Agregar" sin duplicar
5. Funciona en `file://` en Chrome Android, con persistencia entre cierres
6. Toda la interfaz es usable a 360 px de ancho
