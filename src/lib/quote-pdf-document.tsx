import { Document, Image, Link, Page, StyleSheet, Text, View } from "@react-pdf/renderer"

import { quoteTotals } from "@/lib/calc"
import { BRAND_COLORS } from "@/lib/constants"
import type { Quote, QuoteFormatSettings } from "@/lib/types"
import { formatCurrency, formatDate } from "@/lib/utils"

const LOGO_URL = "/icon/android-icon-192x192.png"

const WATERMARK_URL = "/icon/amcdag.png"

/** Colores del arcoíris de la barra separadora vertical. */
const RAINBOW_COLORS = ["#ecadc4", "#9bd9d5", "#d0aeec", "#f8c4a5"]

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 9,
    color: BRAND_COLORS.ink,
    padding: 28,
  },
  headerBand: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  logo: {
    width: 54,
    height: 54,
    objectFit: "contain" as const,
  },
  rainbowBar: {
    width: 6,
    height: 64,
    flexDirection: "column",
    borderRadius: 3,
    overflow: "hidden",
  },
  rainbowSegment: { flex: 1 },
  brandBlock: { flex: 1 },
  brandName: {
    fontSize: 16,
    fontWeight: 700,
    color: BRAND_COLORS.ink,
    letterSpacing: 0.5,
  },
  brandContact: {
    fontSize: 8.5,
    color: "#4b5563",
    marginTop: 3,
  },
  link: {
    color: "#4b5563",
    textDecoration: "none",
  },
  eventMeta: { fontSize: 8, color: "#4b5563", textAlign: "right", lineHeight: 1.5 },
  headerDivider: {
    marginTop: 18,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
  },
  body: { paddingTop: 14, paddingBottom: 20 },
  sectionTitle: {
    fontSize: 9,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: 1,
    color: BRAND_COLORS.primaryDark,
    marginBottom: 6,
  },
  clientSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 20,
    marginBottom: 18,
  },
  clientCard: {
    width: "52%",
    border: 1,
    borderColor: "#e5e7eb",
    borderRadius: 6,
    padding: 10,
    gap: 4,
  },
  clientRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  clientLabel: { fontSize: 7.5, color: BRAND_COLORS.muted, textTransform: "uppercase", width: 70 },
  clientValue: { fontSize: 10, fontWeight: 600, color: BRAND_COLORS.ink },
  eventTypeBand: {
    flexDirection: "column",
    alignItems: "flex-end",
    gap: 2,
  },
  eventTypeLabel: {
    fontSize: 7.5,
    color: BRAND_COLORS.muted,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  eventTypeValue: {
    fontSize: 12.5,
    fontWeight: 700,
    color: BRAND_COLORS.primaryDark,
  },
  sectionSubtitle: {
    marginTop: 6,
    marginBottom: 10,
    textAlign: "center",
    fontSize: 20,
    fontWeight: 700,
    letterSpacing: 4,
    color: BRAND_COLORS.primaryDark,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: BRAND_COLORS.light,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  tableHeaderCell: { fontSize: 8, fontWeight: 700, color: BRAND_COLORS.muted },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 7,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  tableCell: { fontSize: 9, color: BRAND_COLORS.ink },
  nameCell: { width: "42%", paddingRight: 8 },
  qtyCell: { width: "12%", textAlign: "center" },
  unitCell: { width: "23%", textAlign: "right", paddingRight: 8 },
  amountCell: { width: "23%", textAlign: "right" },
  totals: { marginTop: 12, alignItems: "flex-end", gap: 4 },
  totalsRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 24,
    width: "55%",
  },
  totalsLabel: { fontSize: 9, color: BRAND_COLORS.muted, flex: 1, textAlign: "right" },
  totalsValue: { fontSize: 9, fontWeight: 600, width: 90, textAlign: "right" },
  grandTotalRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 24,
    width: "55%",
    backgroundColor: "#fdf2f7",
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 4,
    marginTop: 2,
  },
  grandTotalLabel: { fontSize: 10, fontWeight: 700, flex: 1, textAlign: "right" },
  grandTotalValue: { fontSize: 11, fontWeight: 700, width: 90, textAlign: "right" },
  notesBox: {
    marginTop: 22,
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
    paddingTop: 12,
  },
  notesText: { fontSize: 8.5, color: BRAND_COLORS.muted, marginTop: 4, lineHeight: 1.5 },
  validity: { fontSize: 8.5, color: BRAND_COLORS.muted, marginTop: 10, lineHeight: 1.5 },
  depositRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 24,
    width: "55%",
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  balanceRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 24,
    width: "55%",
    backgroundColor: "#ecfdf5",
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 4,
    marginTop: 2,
  },
  balanceLabel: { fontSize: 10, fontWeight: 700, flex: 1, textAlign: "right" },
  balanceValue: { fontSize: 11, fontWeight: 700, width: 90, textAlign: "right", color: "#047857" },
  legendBox: {
    marginTop: 24,
    backgroundColor: "#fdf2f7",
    borderWidth: 1,
    borderColor: "#f9c2d7",
    borderRadius: 6,
    padding: 12,
  },
  legendTitle: {
    fontSize: 8,
    fontWeight: 700,
    color: "#9d5c82",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 4,
  },
  legendText: { fontSize: 8, color: "#4b5563", lineHeight: 1.6 },
  footerBand: {
    position: "absolute",
    bottom: 28,
    left: 28,
    right: 28,
    backgroundColor: BRAND_COLORS.primary,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 6,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  footerText: { fontSize: 7.5, color: "#374151" },
  statusChip: {
    backgroundColor: "rgba(235,172,195,0.35)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    fontSize: 8,
    fontWeight: 700,
    color: "#9d5c82",
    textAlign: "center",
  },
  watermark: {
    position: "absolute",
    left: -120,
    bottom: -120,
    width: 340,
    height: 340,
    opacity: 0.18,
    objectFit: "contain" as const,
  },
})

export async function loadLogoAsDataUri(url: string): Promise<string | null> {
  try {
    const response = await fetch(url)
    const blob = await response.blob()
    return await new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(String(reader.result))
      reader.onerror = () => reject(new Error("No se pudo cargar el logo."))
      reader.readAsDataURL(blob)
    })
  } catch {
    return null
  }
}

export function QuotePDFDocument({
  quote,
  quoteFormat,
  logoDataUri,
  watermarkDataUri,
}: {
  quote: Quote
  quoteFormat: QuoteFormatSettings
  logoDataUri?: string | null
  watermarkDataUri?: string | null
}) {
  const totals = quoteTotals(quote)
  const showDiscount = totals.discount > 0.004
  const showTax = quote.taxRate > 0
  const deposit = Number(quote.deposit) || 0
  const showDeposit = deposit > 0
  const balance = Math.max(0, totals.total - deposit)
  const phoneDigits = quoteFormat.phone.replace(/[^0-9]/g, "")
  const whatsappLink = `https://wa.me/${phoneDigits}?text=${encodeURIComponent(quoteFormat.whatsappMessage)}`

  return (
    <Document
      title={`Cotización ${quote.code} - ${quote.clientName}`}
      author={quoteFormat.businessName}
      subject={quote.code}
    >
      <Page size="A4" style={styles.page}>
        <Image style={styles.watermark} src={watermarkDataUri ?? WATERMARK_URL} fixed />
        <View style={styles.headerBand}>
          <Image style={styles.logo} src={logoDataUri ?? LOGO_URL} fixed />
          <View style={styles.rainbowBar}>
            {RAINBOW_COLORS.map((color) => (
              <View key={color} style={[styles.rainbowSegment, { backgroundColor: color }]} />
            ))}
          </View>
          <View style={styles.brandBlock}>
            <Text style={styles.brandName}>{quoteFormat.businessName}</Text>
            <Text style={styles.brandContact}>
              <Link href={quoteFormat.mapsUrl} style={styles.link}>
                {quoteFormat.address}
              </Link>
            </Text>
            {quoteFormat.phone && (
              <Text style={styles.brandContact}>
                <Link href={whatsappLink} style={styles.link}>Tel. {quoteFormat.phone}</Link>
              </Text>
            )}
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={styles.eventMeta}>
              {quote.code} · {formatDate(quote.createdAt)}
            </Text>
            {quote.status && <Text style={styles.statusChip}>{quote.status}</Text>}
          </View>
        </View>

        <View style={styles.headerDivider} />

        <View style={styles.body}>
          <View style={styles.clientSection}>
            <View style={styles.clientCard}>
              <View style={styles.clientRow}>
                <Text style={styles.clientLabel}>Cliente</Text>
                <Text style={styles.clientValue}>{quote.clientName}</Text>
              </View>
              <View style={styles.clientRow}>
                <Text style={styles.clientLabel}>Teléfono</Text>
                <Text style={styles.clientValue}>{quote.clientPhone || "—"}</Text>
              </View>
              <View style={styles.clientRow}>
                <Text style={styles.clientLabel}>Correo</Text>
                <Text style={styles.clientValue}>{quote.clientEmail || "—"}</Text>
              </View>
            </View>

            <View style={styles.eventTypeBand}>
              <Text style={styles.eventTypeLabel}>Tipo de evento</Text>
              <Text style={styles.eventTypeValue}>{quote.eventTypeName || "General"}</Text>
            </View>
          </View>

          <Text style={[styles.eventTypeValue, styles.sectionSubtitle]}>COTIZACIÓN</Text>

          <Text style={styles.sectionTitle}>Detalle de productos y servicios</Text>
          <View style={styles.tableHeader}>
            <View style={[styles.tableHeaderCell, styles.nameCell]}>
              <Text>Concepto</Text>
            </View>
            <View style={[styles.tableHeaderCell, styles.qtyCell]}>
              <Text>Cant.</Text>
            </View>
            <View style={[styles.tableHeaderCell, styles.unitCell]}>
              <Text>P. unitario</Text>
            </View>
            <View style={[styles.tableHeaderCell, styles.amountCell]}>
              <Text>Importe</Text>
            </View>
          </View>

          {quote.items.map((item) => (
            <View key={item.id} style={styles.tableRow}>
              <View style={styles.nameCell}>
                <Text style={styles.tableCell}>
                  {item.name}
                  {item.description ? ` — ${item.description}` : ""}
                </Text>
              </View>
              <View style={styles.qtyCell}>
                <Text style={styles.tableCell}>{item.quantity}</Text>
              </View>
              <View style={styles.unitCell}>
                <Text style={styles.tableCell}>{formatCurrency(Number(item.unitPrice))}</Text>
              </View>
              <View style={styles.amountCell}>
                <Text style={styles.tableCell}>
                  {formatCurrency(Number(item.quantity) * Number(item.unitPrice))}
                </Text>
              </View>
            </View>
          ))}

          <View style={styles.totals}>
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>Subtotal</Text>
              <Text style={styles.totalsValue}>{formatCurrency(totals.subtotal)}</Text>
            </View>
            {showDiscount && (
              <View style={styles.totalsRow}>
                <Text style={styles.totalsLabel}>
                  Descuento ({quote.discountType === "percent" ? `${quote.discountValue}%` : "fijo"})
                </Text>
                <Text style={[styles.totalsValue, { color: "#b91c1c" }]}>
                  -{formatCurrency(totals.discount)}
                </Text>
              </View>
            )}
            {showTax && (
              <View style={styles.totalsRow}>
                <Text style={styles.totalsLabel}>Impuesto ({quote.taxRate}%)</Text>
                <Text style={styles.totalsValue}>{formatCurrency(totals.tax)}</Text>
              </View>
            )}
            <View style={styles.grandTotalRow}>
              <Text style={styles.grandTotalLabel}>TOTAL</Text>
              <Text style={styles.grandTotalValue}>{formatCurrency(totals.total)}</Text>
            </View>
            {showDeposit && (
              <>
                <View style={styles.depositRow}>
                  <Text style={styles.totalsLabel}>Anticipo pagado</Text>
                  <Text style={[styles.totalsValue, { color: "#047857" }]}>
                    -{formatCurrency(deposit)}
                  </Text>
                </View>
                <View style={styles.balanceRow}>
                  <Text style={styles.balanceLabel}>SALDO POR PAGAR</Text>
                  <Text style={styles.balanceValue}>{formatCurrency(balance)}</Text>
                </View>
              </>
            )}
          </View>

          {(quote.notes || quoteFormat.validityText) && (
            <View style={styles.notesBox}>
              {quote.notes && (
                <View>
                  <Text style={styles.sectionTitle}>Notas</Text>
                  <Text style={styles.notesText}>{quote.notes}</Text>
                </View>
              )}
              {quoteFormat.validityText && (
                <Text style={styles.validity}>{quoteFormat.validityText}</Text>
              )}
            </View>
          )}

          {quoteFormat.footerText && (
            <View style={styles.legendBox}>
              <Text style={styles.legendTitle}>Información de pago</Text>
              <Text style={styles.legendText}>{quoteFormat.footerText}</Text>
            </View>
          )}
        </View>

        <View style={styles.footerBand} fixed>
          <Text style={styles.footerText}>
            {quoteFormat.businessName} · {quoteFormat.phone}
          </Text>
          <Text style={styles.footerText} render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`} />
        </View>
      </Page>
    </Document>
  )
}

export { LOGO_URL, WATERMARK_URL }