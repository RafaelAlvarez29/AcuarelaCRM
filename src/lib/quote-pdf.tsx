import type { Quote, QuoteFormatSettings } from "@/lib/types"

/** Genera el PDF de la cotización y lo descarga en el navegador. */
export async function downloadQuotePdf(
  quote: Quote,
  quoteFormat: QuoteFormatSettings,
): Promise<void> {
  const [{ pdf }, { QuotePDFDocument, loadLogoAsDataUri, LOGO_URL, WATERMARK_URL }] = await Promise.all([
    import("@react-pdf/renderer"),
    import("@/lib/quote-pdf-document"),
  ])
  const logoDataUri = await loadLogoAsDataUri(LOGO_URL)
  const watermarkDataUri = await loadLogoAsDataUri(WATERMARK_URL)
  const blob = await pdf(
    <QuotePDFDocument
      quote={quote}
      quoteFormat={quoteFormat}
      logoDataUri={logoDataUri}
      watermarkDataUri={watermarkDataUri}
    />,
  ).toBlob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `${quote.code.replace(/[^a-zA-Z0-9_-]/g, "_")}.pdf`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export async function getQuotePdfDataUri(
  quote: Quote,
  quoteFormat: QuoteFormatSettings,
): Promise<string | null> {
  try {
    const [{ pdf }, { QuotePDFDocument, loadLogoAsDataUri, LOGO_URL, WATERMARK_URL }] = await Promise.all([
      import("@react-pdf/renderer"),
      import("@/lib/quote-pdf-document"),
    ])
    const logoDataUri = await loadLogoAsDataUri(LOGO_URL)
    const watermarkDataUri = await loadLogoAsDataUri(WATERMARK_URL)
    const blob = await pdf(
      <QuotePDFDocument
        quote={quote}
        quoteFormat={quoteFormat}
        logoDataUri={logoDataUri}
        watermarkDataUri={watermarkDataUri}
      />,
    ).toBlob()
    return await new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(String(reader.result))
      reader.onerror = () => reject(new Error("No se pudo convertir a PDF."))
      reader.readAsDataURL(blob)
    })
  } catch {
    return null
  }
}