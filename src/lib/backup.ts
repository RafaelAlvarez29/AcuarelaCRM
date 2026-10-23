import { z } from "zod"

import { PROJECT_STATUSES, QUOTE_STATUSES, type AppData } from "@/lib/types"

const LAST_BACKUP_KEY = "acuarela-last-backup"

/** Días sin exportar un respaldo tras los cuales se muestra el recordatorio. */
export const BACKUP_REMINDER_DAYS = 7

/** Evento de window que se emite al exportar un respaldo. */
export const BACKUP_EXPORTED_EVENT = "acuarela:backup-exported"

/* ---------- Esquema del archivo de respaldo ----------
 * Valida la forma de cada registro antes de importarlo. Los campos opcionales
 * reciben valores por defecto y las colecciones que falten se tratan como
 * vacías, para que un respaldo parcial o de una versión anterior no rompa la app.
 */
const id = z.string().min(1)
const isoDate = z.string().catch(() => new Date().toISOString())
const money = z.coerce.number().refine(Number.isFinite).catch(0)
const optionalText = z.string().nullish().catch(null)
const optionalImage = z.string().nullish().catch(null)

const clientSchema = z.object({
  id,
  name: z.string().min(1),
  whatsapp_number: z.string().catch(""),
  email: optionalText,
  photoBase64: optionalImage,
  creationDate: isoDate,
  isActive: z.boolean().catch(true),
})

const projectSchema = z.object({
  id,
  clientId: id,
  name: z.string().min(1),
  totalPrice: money,
  isPaid: z.boolean().nullish().catch(null),
  description: z.string().catch(""),
  status: z.enum(PROJECT_STATUSES).catch("Pendiente de inicio"),
  deliveryDate: optionalText,
  creationDate: isoDate,
  lastUpdated: z.string().optional().catch(undefined),
  thumbnailBase64: optionalImage,
  sourceQuoteId: optionalText,
  order: z.number().optional().catch(undefined),
})

const paymentSchema = z.object({
  id,
  projectId: id,
  amount: money,
  date: isoDate,
})

const eventTypeSchema = z.object({
  id,
  name: z.string().min(1),
  series: optionalText,
  isActive: z.boolean().catch(true),
  createdAt: isoDate,
})

const productSchema = z.object({
  id,
  name: z.string().min(1),
  description: optionalText,
  price: money,
  priceByEventType: z.record(z.string(), z.coerce.number()).catch({}),
  category: optionalText,
  imageBase64: optionalImage,
  isActive: z.boolean().catch(true),
  createdAt: isoDate,
})

const quoteItemSchema = z.object({
  id,
  productId: optionalText,
  name: z.string(),
  description: optionalText,
  quantity: money,
  unitPrice: money,
})

const quoteSchema = z.object({
  id,
  code: z.string().min(1),
  clientId: optionalText,
  clientName: z.string().catch(""),
  clientPhone: z.string().catch(""),
  clientEmail: optionalText,
  eventTypeId: optionalText,
  eventTypeName: optionalText,
  items: z.array(quoteItemSchema).catch([]),
  discountType: z.enum(["percent", "fixed"]).catch("percent"),
  discountValue: money,
  taxRate: money,
  deposit: money,
  notes: optionalText,
  status: z.enum(QUOTE_STATUSES).catch("Borrador"),
  createdAt: isoDate,
  validUntil: optionalText,
})

/** Conserva los registros válidos de una lista y cuenta los descartados. */
function keepValid<T extends z.ZodType>(schema: T) {
  return (items: unknown[]) => {
    const valid: z.infer<T>[] = []
    for (const item of items) {
      const parsed = schema.safeParse(item)
      if (parsed.success) valid.push(parsed.data)
    }
    return { valid, discarded: items.length - valid.length }
  }
}

/** Colección obligatoria: si falta o no es lista, el archivo no es un respaldo. */
const requiredList = <T extends z.ZodType>(schema: T) => z.array(z.unknown()).transform(keepValid(schema))
/** Colección opcional: si falta (respaldos antiguos) se trata como vacía. */
const optionalList = <T extends z.ZodType>(schema: T) =>
  z.array(z.unknown()).catch([]).transform(keepValid(schema))

const backupSchema = z.object({
  clients: requiredList(clientSchema),
  projects: requiredList(projectSchema),
  payments: optionalList(paymentSchema),
  eventTypes: optionalList(eventTypeSchema),
  products: optionalList(productSchema),
  quotes: optionalList(quoteSchema),
  // Los ajustes se normalizan en el store (normalizeSettings).
  settings: z.unknown().optional(),
})

export interface BackupReadResult {
  data: AppData
  /** Registros con forma inválida que no se importarán. */
  discarded: number
}

/** Descarga el backup completo de los datos como archivo JSON. */
export function downloadBackup(data: AppData) {
  const jsonString = JSON.stringify(data, null, 2)
  const blob = new Blob([jsonString], { type: "application/json" })
  const url = URL.createObjectURL(blob)

  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "")
  const filename = `DataAcuarelaCRM_${date}.json`

  const a = document.createElement("a")
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  // Revocar en el mismo tick puede cancelar la descarga en algunos navegadores.
  setTimeout(() => URL.revokeObjectURL(url), 1000)

  try {
    localStorage.setItem(LAST_BACKUP_KEY, new Date().toISOString())
  } catch {
    // Sin acceso a localStorage solo se pierde el recordatorio.
  }
  window.dispatchEvent(new Event(BACKUP_EXPORTED_EVENT))
}

/** Fecha del último respaldo exportado desde este navegador. */
export function getLastBackupDate(): Date | null {
  try {
    const value = localStorage.getItem(LAST_BACKUP_KEY)
    const date = value ? new Date(value) : null
    return date && !Number.isNaN(date.getTime()) ? date : null
  } catch {
    return null
  }
}

/**
 * Lee, parsea y valida un archivo JSON de respaldo.
 * Devuelve null si no es JSON o no tiene la forma mínima (clients y projects).
 */
export function readBackupFile(file: File): Promise<BackupReadResult | null> {
  return new Promise((resolve) => {
    if (!file.name.toLowerCase().endsWith(".json") && file.type !== "application/json") {
      resolve(null)
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const parsed = backupSchema.safeParse(JSON.parse(String(reader.result ?? "")))
        if (!parsed.success) {
          resolve(null)
          return
        }
        const { clients, projects, payments, eventTypes, products, quotes, settings } = parsed.data
        resolve({
          data: {
            clients: clients.valid,
            projects: projects.valid,
            payments: payments.valid,
            eventTypes: eventTypes.valid,
            products: products.valid,
            quotes: quotes.valid,
            settings: settings as AppData["settings"],
          },
          discarded:
            clients.discarded +
            projects.discarded +
            payments.discarded +
            eventTypes.discarded +
            products.discarded +
            quotes.discarded,
        })
      } catch {
        resolve(null)
      }
    }
    reader.onerror = () => resolve(null)
    reader.readAsText(file)
  })
}
