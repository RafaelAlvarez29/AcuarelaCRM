/**
 * Convierte el logo y la marca de agua a data: URI y los escribe como módulo
 * TypeScript para que queden dentro del bundle.
 *
 * Se ejecuta ANTES de vite build. La app móvil no puede usar fetch() para
 * cargarlos como hace la app de escritorio: abierta desde file:// no hay
 * servidor del cual pedirlos.
 */
import { Buffer } from "node:buffer"
import { readFile, writeFile } from "node:fs/promises"
import { fileURLToPath, URL } from "node:url"

const raiz = new URL("../", import.meta.url)

const ASSETS = [
  { nombre: "LOGO_DATA_URI", ruta: "public/icon/android-icon-192x192.png", tipo: "image/png" },
  { nombre: "MARCA_AGUA_DATA_URI", ruta: "public/icon/amcdag.png", tipo: "image/png" },
]

const partes = [
  "// ARCHIVO GENERADO por scripts/generar-assets.mjs — no editar a mano.",
  "// Se regenera en cada `npm run movil`.",
  "",
]

for (const asset of ASSETS) {
  const absoluta = fileURLToPath(new URL(asset.ruta, raiz))
  const bytes = await readFile(absoluta)
  const base64 = Buffer.from(bytes).toString("base64")
  partes.push(`export const ${asset.nombre} = "data:${asset.tipo};base64,${base64}"`)
  partes.push("")
  console.log(`  ${asset.ruta} -> ${asset.nombre} (${(base64.length / 1024).toFixed(0)} KB en base64)`)
}

const destino = fileURLToPath(new URL("movil/assets-generados.ts", raiz))
await writeFile(destino, partes.join("\n"), "utf8")
console.log(`Assets escritos en movil/assets-generados.ts`)
