import type { StateStorage } from "zustand/middleware"
import { toast } from "sonner"

/**
 * Almacenamiento para el store basado en IndexedDB.
 *
 * localStorage tiene un límite de ~5 MB y las imágenes en base64 lo agotan con
 * unas decenas de fotos; cuando eso pasa `persist` falla sin avisar y los
 * cambios se pierden al recargar. IndexedDB permite cientos de MB.
 */
const DB_NAME = "acuarela-crm"
const STORE_NAME = "kv"

let dbPromise: Promise<IDBDatabase> | null = null

function openDb(): Promise<IDBDatabase> {
  dbPromise ??= new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1)
    request.onupgradeneeded = () => request.result.createObjectStore(STORE_NAME)
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
  return dbPromise
}

async function run<T>(
  mode: IDBTransactionMode,
  action: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, mode)
    const request = action(tx.objectStore(STORE_NAME))
    tx.oncomplete = () => resolve(request.result)
    tx.onerror = () => reject(tx.error)
    tx.onabort = () => reject(tx.error)
  })
}

let warnedWriteError = false

export const idbStorage: StateStorage = {
  async getItem(name) {
    const stored = await run<string | undefined>("readonly", (s) => s.get(name))
    if (typeof stored === "string") return stored

    // Migración única: los datos de versiones anteriores viven en localStorage.
    const legacy = localStorage.getItem(name)
    if (legacy !== null) {
      await run("readwrite", (s) => s.put(legacy, name))
      localStorage.removeItem(name)
    }
    return legacy
  },

  async setItem(name, value) {
    try {
      await run("readwrite", (s) => s.put(value, name))
      warnedWriteError = false
    } catch (error) {
      console.error("No se pudieron guardar los datos", error)
      if (!warnedWriteError) {
        warnedWriteError = true
        toast.error(
          "No se pudieron guardar los últimos cambios. Exporta un respaldo desde Datos antes de cerrar la app.",
          { duration: Infinity },
        )
      }
    }
  },

  async removeItem(name) {
    await run("readwrite", (s) => s.delete(name))
  },
}

/** Pide al navegador que no borre los datos de la app automáticamente por falta de espacio. */
export function requestPersistentStorage() {
  if (navigator.storage?.persist) void navigator.storage.persist().catch(() => undefined)
}
