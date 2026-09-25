/**
 * Capa de almacenamiento de Acuarela Móvil.
 *
 * Intenta IndexedDB y, si el navegador la bloquea, degrada a localStorage y
 * finalmente a memoria. Se verificó que IndexedDB funciona abriendo el archivo
 * como file:// en Chrome Android, así que la cascada es solo una red de
 * seguridad para otros dispositivos.
 *
 * Los registros se guardan con la estructura exacta de src/lib/types.ts. El
 * marcado de "creado en este teléfono" vive en un store aparte (`origen`) para
 * que el JSON exportado sea idéntico en forma al de la app de escritorio.
 */

const NOMBRE_DB = "acuarela-movil"
const VERSION_DB = 1
const CLAVE_RESPALDO = "acuarela-movil"
const TIEMPO_LIMITE_MS = 5000

export type NombreStore = "clients" | "products" | "eventTypes" | "quotes"

type NombreAlmacen = NombreStore | "meta" | "origen"

const ALMACENES: NombreAlmacen[] = ["clients", "products", "eventTypes", "quotes", "meta", "origen"]

export type ModoAlmacenamiento = "indexeddb" | "localstorage" | "memoria"

interface RegistroConId {
  id: string
}

/** Forma de los datos cuando no hay IndexedDB. */
type Espejo = Record<string, Record<string, unknown>>

let modo: ModoAlmacenamiento = "memoria"
let db: IDBDatabase | null = null
let espejo: Espejo = {}
let iniciada: Promise<void> | null = null

function espejoVacio(): Espejo {
  const vacio: Espejo = {}
  for (const almacen of ALMACENES) vacio[almacen] = {}
  return vacio
}

// --- Respaldo en localStorage -------------------------------------------------

function leerRespaldo(): Espejo | null {
  try {
    const crudo = localStorage.getItem(CLAVE_RESPALDO)
    if (!crudo) return espejoVacio()
    const analizado = JSON.parse(crudo) as Espejo
    const completo = espejoVacio()
    for (const almacen of ALMACENES) {
      if (analizado[almacen] && typeof analizado[almacen] === "object") {
        completo[almacen] = analizado[almacen]
      }
    }
    return completo
  } catch {
    return null
  }
}

function escribirRespaldo(): void {
  if (modo !== "localstorage") return
  try {
    localStorage.setItem(CLAVE_RESPALDO, JSON.stringify(espejo))
  } catch {
    // Cuota agotada: se conserva lo que ya hay en memoria y se sigue trabajando.
  }
}

// --- Apertura -----------------------------------------------------------------

function abrirIndexedDB(): Promise<IDBDatabase> {
  return new Promise((resolver, rechazar) => {
    if (typeof indexedDB === "undefined" || !indexedDB) {
      rechazar(new Error("indexedDB no disponible"))
      return
    }

    let resuelta = false
    const temporizador = setTimeout(() => {
      if (!resuelta) rechazar(new Error("indexedDB no respondió"))
    }, TIEMPO_LIMITE_MS)

    const solicitud = indexedDB.open(NOMBRE_DB, VERSION_DB)

    solicitud.onupgradeneeded = () => {
      const base = solicitud.result
      for (const almacen of ALMACENES) {
        if (base.objectStoreNames.contains(almacen)) continue
        base.createObjectStore(almacen, { keyPath: almacen === "meta" ? "k" : "id" })
      }
    }
    solicitud.onsuccess = () => {
      resuelta = true
      clearTimeout(temporizador)
      resolver(solicitud.result)
    }
    solicitud.onerror = () => {
      resuelta = true
      clearTimeout(temporizador)
      rechazar(solicitud.error ?? new Error("error al abrir indexedDB"))
    }
    solicitud.onblocked = () => {
      resuelta = true
      clearTimeout(temporizador)
      rechazar(new Error("apertura bloqueada"))
    }
  })
}

export function abrirDB(): Promise<void> {
  if (iniciada) return iniciada

  iniciada = (async () => {
    try {
      db = await abrirIndexedDB()
      modo = "indexeddb"
      return
    } catch {
      db = null
    }

    const respaldo = leerRespaldo()
    if (respaldo) {
      espejo = respaldo
      modo = "localstorage"
      return
    }

    espejo = espejoVacio()
    modo = "memoria"
  })()

  return iniciada
}

export function modoAlmacenamiento(): ModoAlmacenamiento {
  return modo
}

// --- Operaciones --------------------------------------------------------------

function transaccion(almacen: NombreAlmacen, escritura: boolean): IDBObjectStore {
  if (!db) throw new Error("db no abierta")
  return db.transaction(almacen, escritura ? "readwrite" : "readonly").objectStore(almacen)
}

function promesa<T>(solicitud: IDBRequest<T>): Promise<T> {
  return new Promise((resolver, rechazar) => {
    solicitud.onsuccess = () => resolver(solicitud.result)
    solicitud.onerror = () => rechazar(solicitud.error ?? new Error("error de IndexedDB"))
  })
}

/** Reemplaza por completo el contenido de un store. */
export async function guardarColeccion<T extends RegistroConId>(
  almacen: NombreStore,
  registros: T[],
): Promise<void> {
  await abrirDB()

  if (modo === "indexeddb") {
    const store = transaccion(almacen, true)
    await promesa(store.clear())
    for (const registro of registros) await promesa(store.put(registro))
    return
  }

  espejo[almacen] = {}
  for (const registro of registros) espejo[almacen]![registro.id] = registro
  escribirRespaldo()
}

export async function leerColeccion<T>(almacen: NombreStore): Promise<T[]> {
  await abrirDB()

  if (modo === "indexeddb") {
    return (await promesa(transaccion(almacen, false).getAll())) as T[]
  }

  return Object.values(espejo[almacen] ?? {}) as T[]
}

export async function guardarUno<T extends RegistroConId>(
  almacen: NombreStore,
  registro: T,
): Promise<void> {
  await abrirDB()

  if (modo === "indexeddb") {
    await promesa(transaccion(almacen, true).put(registro))
    return
  }

  espejo[almacen] ??= {}
  espejo[almacen]![registro.id] = registro
  escribirRespaldo()
}

export async function borrarUno(almacen: NombreStore, id: string): Promise<void> {
  await abrirDB()

  if (modo === "indexeddb") {
    await promesa(transaccion(almacen, true).delete(id))
    return
  }

  delete espejo[almacen]?.[id]
  escribirRespaldo()
}

// --- Metadatos ----------------------------------------------------------------

export async function guardarMeta(clave: string, valor: unknown): Promise<void> {
  await abrirDB()

  if (modo === "indexeddb") {
    await promesa(transaccion("meta", true).put({ k: clave, v: valor }))
    return
  }

  espejo.meta ??= {}
  espejo.meta[clave] = { k: clave, v: valor }
  escribirRespaldo()
}

export async function leerMeta<T>(clave: string): Promise<T | null> {
  await abrirDB()

  if (modo === "indexeddb") {
    const fila = (await promesa(transaccion("meta", false).get(clave))) as
      | { k: string; v: T }
      | undefined
    return fila ? fila.v : null
  }

  const fila = espejo.meta?.[clave] as { k: string; v: T } | undefined
  return fila ? fila.v : null
}

// --- Origen de los registros --------------------------------------------------

/** Registra que un id fue creado en este teléfono (para exportarlo de vuelta). */
export async function marcarOrigenMovil(id: string): Promise<void> {
  await abrirDB()

  if (modo === "indexeddb") {
    await promesa(transaccion("origen", true).put({ id }))
    return
  }

  espejo.origen ??= {}
  espejo.origen[id] = { id }
  escribirRespaldo()
}

export async function idsCreadosEnMovil(): Promise<Set<string>> {
  await abrirDB()

  if (modo === "indexeddb") {
    const filas = (await promesa(transaccion("origen", false).getAll())) as RegistroConId[]
    return new Set(filas.map((fila) => fila.id))
  }

  return new Set(Object.keys(espejo.origen ?? {}))
}
