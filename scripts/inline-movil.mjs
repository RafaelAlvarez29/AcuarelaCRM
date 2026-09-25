/**
 * Empaqueta el build de la app móvil en un único archivo HTML autocontenido.
 *
 * Toma dist-movil/index.html y sustituye cada <script src> y cada
 * <link rel="stylesheet"> por su contenido en línea, produciendo
 * dist-movil/AcuarelaMovil.html.
 *
 * No usa dependencias externas: solo módulos de Node.
 */
import { readdir, readFile, stat, unlink, writeFile } from "node:fs/promises"
import { fileURLToPath, URL } from "node:url"

const dist = new URL("../dist-movil/", import.meta.url)
const rutaDist = (nombre) => fileURLToPath(new URL(nombre, dist))

/**
 * Cadenas que JAMÁS deben aparecer en el archivo distribuible.
 * DEFAULT_QUOTE_FORMAT de src/lib/constants.ts contiene datos bancarios reales;
 * el formato de cotización debe llegar únicamente desde el JSON que importe el
 * usuario. Si el bundler arrastra esas constantes, este script aborta el build.
 */
const PROHIBIDO = [
  "4152 3143 1401 7180",
  "4152314314017180",
  "ITZEL YANNIN MEZA LOYA",
  "yannin.meza96@gmail.com",
]

/** Escapa lo que cerraría antes de tiempo un bloque <script> o <style>. */
function escaparParaEtiqueta(texto) {
  return texto.replace(/<\/(script|style)/gi, "<\\/$1")
}

const entrada = rutaDist("index.html")
let html = await readFile(entrada, "utf8")

const inlineados = []

// --- Quitar modulepreload: el módulo va incrustado, no hay nada que precargar ---
html = html.replace(/<link\b[^>]*rel=["']modulepreload["'][^>]*>\s*/gi, "")

// --- Hojas de estilo ---
for (const [etiqueta] of [...html.matchAll(/<link\b[^>]*rel=["']stylesheet["'][^>]*>/gi)]) {
  const href = etiqueta.match(/href=["']([^"']+)["']/i)?.[1]
  if (!href || /^(https?:|data:)/i.test(href)) continue
  const css = await readFile(rutaDist(href.replace(/^\.?\//, "")), "utf8")
  const bloque = `<style>\n${escaparParaEtiqueta(css)}\n</style>`
  // Reemplazo con función: si se pasara el texto directo, los $ del contenido
  // se interpretarían como patrones especiales ($&, $1...) y corromperían todo.
  html = html.replace(etiqueta, () => bloque)
  inlineados.push(href)
}

// --- Scripts ---
for (const [etiqueta, src] of [
  ...html.matchAll(/<script\b[^>]*\bsrc=["']([^"']+)["'][^>]*>\s*<\/script>/gi),
]) {
  if (/^(https?:|data:)/i.test(src)) continue
  const js = await readFile(rutaDist(src.replace(/^\.?\//, "")), "utf8")
  const bloque = `<script type="module">\n${escaparParaEtiqueta(js)}\n</script>`
  html = html.replace(etiqueta, () => bloque)
  inlineados.push(src)
}

// --- Verificación: ninguna etiqueta debe seguir apuntando a un archivo ---
// Se revisan ETIQUETAS, no atributos sueltos: el JS incrustado contiene
// cadenas como src=" dentro de plantillas y daría falsos positivos.
const pendientes = [
  ...html.matchAll(/<script\b[^>]*\bsrc=["']([^"']+)["']/gi),
  ...html.matchAll(/<link\b[^>]*\bhref=["']([^"']+)["']/gi),
  ...html.matchAll(/<img\b[^>]*\bsrc=["']([^"']+)["']/gi),
]
  .map(([, valor]) => valor)
  .filter((valor) => !/^(data:|https?:|#|mailto:)/i.test(valor))

if (pendientes.length > 0) {
  console.error("ABORTADO: quedaron referencias a archivos externos:")
  for (const referencia of pendientes) console.error(`  - ${referencia}`)
  process.exit(1)
}

// --- Verificación de seguridad: sin datos bancarios ---
const plano = html.replace(/\s+/g, " ")
const sinEspacios = plano.replace(/ /g, "")
for (const secreto of PROHIBIDO) {
  if (plano.includes(secreto) || sinEspacios.includes(secreto.replace(/\s+/g, ""))) {
    console.error("ABORTADO: el HTML generado contiene datos sensibles.")
    console.error(`Coincidencia: ${secreto.slice(0, 10)}...`)
    console.error("Revisa que movil/ no importe DEFAULT_QUOTE_FORMAT.")
    process.exit(1)
  }
}

const salida = rutaDist("AcuarelaMovil.html")
await writeFile(salida, html, "utf8")

// --- Limpieza: en dist-movil solo debe quedar el archivo único ---
for (const nombre of await readdir(fileURLToPath(dist))) {
  if (nombre === "AcuarelaMovil.html") continue
  const ruta = rutaDist(nombre)
  if ((await stat(ruta)).isFile()) await unlink(ruta)
}

const kb = (Buffer.byteLength(html, "utf8") / 1024).toFixed(0)
console.log(`\nIncrustados: ${inlineados.join(", ")}`)
console.log(`Sin datos sensibles: verificado (${PROHIBIDO.length} patrones)`)
console.log(`\n  dist-movil/AcuarelaMovil.html  —  ${kb} KB\n`)
