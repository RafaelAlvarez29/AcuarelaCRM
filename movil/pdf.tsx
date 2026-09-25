/**
 * Generación del PDF de la cotización.
 *
 * Reutiliza QuotePDFDocument de la app de escritorio SIN COPIARLO: se importa
 * el mismo componente y se renderiza con el mismo motor, así que el resultado
 * es idéntico por construcción. Si el PDF cambia en la app principal, aquí
 * cambia solo con recompilar.
 *
 * Única diferencia con src/lib/quote-pdf.tsx: el logo y la marca de agua vienen
 * de constantes incrustadas en el bundle, no de fetch(). Abierta como file://
 * no hay servidor del cual pedirlos.
 */
import { pdf } from "@react-pdf/renderer"

import { QuotePDFDocument } from "@/lib/quote-pdf-document"
import type { Quote, QuoteFormatSettings } from "@/lib/types"

import { LOGO_DATA_URI, MARCA_AGUA_DATA_URI } from "./assets-generados"

export async function generarPdfBlob(
  quote: Quote,
  quoteFormat: QuoteFormatSettings,
): Promise<Blob> {
  return await pdf(
    <QuotePDFDocument
      quote={quote}
      quoteFormat={quoteFormat}
      logoDataUri={LOGO_DATA_URI}
      watermarkDataUri={MARCA_AGUA_DATA_URI}
    />,
  ).toBlob()
}

/** Mismo nombre de archivo que genera la app de escritorio. */
export function nombreArchivo(quote: Quote): string {
  return `${quote.code.replace(/[^a-zA-Z0-9_-]/g, "_")}.pdf`
}

/**
 * Comparte el PDF con el menú nativo del teléfono y, si no está disponible,
 * lo descarga.
 */
export async function compartirPdf(blob: Blob, quote: Quote): Promise<void> {
  const nombre = nombreArchivo(quote)
  const archivo = new File([blob], nombre, { type: "application/pdf" })

  if (navigator.canShare?.({ files: [archivo] })) {
    try {
      await navigator.share({
        files: [archivo],
        title: `Cotización ${quote.code}`,
      })
      return
    } catch {
      // Cancelado por el usuario o no permitido: se descarga.
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
