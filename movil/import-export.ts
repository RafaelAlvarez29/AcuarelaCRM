/**
 * Lectura del respaldo de AcuarelaCRM y construcción del JSON de vuelta.
 *
 * La validación replica la de src/lib/backup.ts para aceptar exactamente los
 * mismos archivos que la app de escritorio.
 */
import type { AppData, Client, EventType, Product, Quote, Settings } from "@/lib/types"

import {
  guardarColeccion,
  guardarMeta,
  idsCreadosEnMovil,
  leerColeccion,
  leerMeta,
} from "./db"

export interface ResumenImportacion {
  productos: number
  clientes: number
  tiposEvento: number
  fecha: string
}

/**
 * Lee y valida un archivo de respaldo. Devuelve null si no es válido.
 * Misma condición que readBackupFile: clients y projects deben ser arrays.
 */
export function leerArchivoBackup(file: File): Promise<AppData | null> {
  return new Promise((resolver) => {
    if (!file.name.toLowerCase().endsWith(".json") && file.type !== "application/json") {
      resolver(null)
      return
    }
    const lector = new FileReader()
    lector.onload = () => {
      try {
        const analizado = JSON.parse(String(lector.result ?? ""))
        if (analizado && Array.isArray(analizado.clients) && Array.isArray(analizado.projects)) {
          resolver(analizado as AppData)
        } else {
          resolver(null)
        }
      } catch {
        resolver(null)
      }
    }
    lector.onerror = () => resolver(null)
    lector.readAsText(file)
  })
}

/**
 * Elimina las imágenes incrustadas. Esta herramienta no las almacena: ocupan
 * casi todo el JSON y el PDF no las usa (solo logo y marca de agua, que van
 * dentro del propio archivo HTML).
 */
export function despojarImagenes(data: AppData): AppData {
  return {
    ...data,
    clients: (data.clients ?? []).map((c) => ({ ...c, photoBase64: null })),
    products: (data.products ?? []).map((p) => ({ ...p, imageBase64: null })),
  }
}

/**
 * Guarda el catálogo importado.
 *
 * No toca el store `quotes`: las cotizaciones hechas en el teléfono se
 * conservan siempre, aunque se reimporte el catálogo.
 */
export async function importar(data: AppData): Promise<ResumenImportacion> {
  const limpio = despojarImagenes(data)
  const fecha = new Date().toISOString()

  await guardarColeccion<Client>("clients", limpio.clients ?? [])
  await guardarColeccion<Product>("products", limpio.products ?? [])
  await guardarColeccion<EventType>("eventTypes", limpio.eventTypes ?? [])
  await guardarMeta("settings", limpio.settings)
  await guardarMeta("importadoEl", fecha)

  return {
    productos: limpio.products?.length ?? 0,
    clientes: limpio.clients?.length ?? 0,
    tiposEvento: limpio.eventTypes?.length ?? 0,
    fecha,
  }
}

export function leerResumenGuardado(): Promise<string | null> {
  return leerMeta<string>("importadoEl")
}

export function leerSettings(): Promise<Settings | null> {
  return leerMeta<Settings>("settings")
}

// --- Exportación de vuelta ----------------------------------------------------

export interface PendientesExportacion {
  cotizaciones: number
  clientes: number
}

export async function contarPendientes(): Promise<PendientesExportacion> {
  const nuevos = await idsCreadosEnMovil()
  const [cotizaciones, clientes] = await Promise.all([
    leerColeccion<Quote>("quotes"),
    leerColeccion<Client>("clients"),
  ])
  return {
    cotizaciones: cotizaciones.filter((q) => nuevos.has(q.id)).length,
    clientes: clientes.filter((c) => nuevos.has(c.id)).length,
  }
}

/**
 * Construye el JSON de vuelta con SOLO lo creado en el teléfono.
 *
 * appendAll de la app de escritorio concatena a ciegas, sin deduplicar por id
 * (src/stores/useAppStore.ts:364). Si aquí se devolviera el catálogo importado,
 * al reintegrar se duplicaría entero. Por eso products y eventTypes van vacíos.
 *
 * projects va vacío pero presente: readBackupFile exige que sea un array.
 */
export async function construirExportacion(): Promise<AppData> {
  const nuevos = await idsCreadosEnMovil()
  const [todasCotizaciones, todosClientes, settings] = await Promise.all([
    leerColeccion<Quote>("quotes"),
    leerColeccion<Client>("clients"),
    leerSettings(),
  ])

  return {
    clients: todosClientes.filter((c) => nuevos.has(c.id)),
    quotes: todasCotizaciones.filter((q) => nuevos.has(q.id)),
    projects: [],
    payments: [],
    eventTypes: [],
    products: [],
    settings: {
      messages: {},
      quoteFormat: settings?.quoteFormat ?? ({} as Settings["quoteFormat"]),
    },
  }
}

export async function descargarExportacion(): Promise<void> {
  const data = await construirExportacion()
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
  const fecha = new Date().toISOString().slice(0, 10).replace(/-/g, "")
  const nombre = `AcuarelaMovil_${fecha}.json`

  const archivo = new File([blob], nombre, { type: "application/json" })
  if (navigator.canShare?.({ files: [archivo] })) {
    try {
      await navigator.share({ files: [archivo], title: nombre })
      return
    } catch {
      // Si cancela el menú de compartir, se cae a la descarga normal.
    }
  }

  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = nombre
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
