import type { Quote } from "@/lib/types"

/**
 * Calcula el siguiente folio. Réplica exacta de getNextQuoteCode
 * (src/stores/useAppStore.ts:109) para que los folios del teléfono sigan la
 * misma numeración que los de la app de escritorio.
 */
export function siguienteFolio(quotes: Quote[], series?: string | null): string {
  const prefijo = series && series.trim() ? series.trim().toUpperCase() : "CT"
  let max = 0
  for (const quote of quotes) {
    if (quote.code.startsWith(`${prefijo}-`)) {
      const numero = Number.parseInt(quote.code.slice(prefijo.length + 1), 10)
      if (Number.isFinite(numero)) max = Math.max(max, numero)
    }
  }
  return `${prefijo}-${String(max + 1).padStart(4, "0")}`
}
