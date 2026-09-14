import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Formatea una cantidad como moneda MXN. */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 2,
  }).format(Number.isFinite(value) ? value : 0)
}

/** Formatea una fecha en formato corto en español. */
export function formatDate(
  value?: string | Date | null,
  options: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric" },
): string {
  if (!value) return "N/A"
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return "N/A"
  return date.toLocaleDateString("es-MX", options)
}

/** Formatea una fecha como YYYY-MM-DD para inputs de tipo date. */
export function toDateInputValue(value?: string | Date | null): string {
  if (!value) return ""
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return ""
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

/** Devuelve la inicial de un nombre en mayúscula. */
export function getInitial(name: string): string {
  return name.trim().charAt(0).toUpperCase() || "?"
}

export function uid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID()
  }
  return `id-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

/** Ruta a la que ir al pulsar "Nuevo Proyecto" (requiere al menos un cliente). */
export function newProjectPath(clientCount: number): string {
  return clientCount > 0 ? "/proyectos/nuevo" : "/clientes/nuevo"
}