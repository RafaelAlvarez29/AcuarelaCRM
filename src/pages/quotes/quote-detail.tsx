import {
  ArrowRight,
  CalendarClock,
  Download,
  Eye,
  FileText,
  FolderPlus,
  Pencil,
  Trash2,
} from "lucide-react"
import { useState, type ReactNode } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { toast } from "sonner"

import { BackButton } from "@/components/common/back-button"
import { ConfirmDialog } from "@/components/common/confirm-dialog"
import { NotFoundState } from "@/components/common/not-found-state"
import { WhatsAppButton } from "@/components/common/whatsapp-button"
import { QuoteStatusBadge } from "@/components/common/status-badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { quoteTotals } from "@/lib/calc"
import { downloadQuotePdf } from "@/lib/quote-pdf"
import type { QuoteStatus } from "@/lib/types"
import { QUOTE_STATUSES } from "@/lib/types"
import { cn, formatCurrency, formatDate } from "@/lib/utils"
import { useAppStore } from "@/stores/useAppStore"

export default function QuoteDetail() {
  const { id = "" } = useParams()
  const navigate = useNavigate()

  const quote = useAppStore((s) => s.quotes.find((q) => q.id === id))
  const updateQuote = useAppStore((s) => s.updateQuote)
  const deleteQuote = useAppStore((s) => s.deleteQuote)
  const addProject = useAppStore((s) => s.addProject)
  const quoteFormat = useAppStore((s) => s.settings.quoteFormat)

  const [downloading, setDownloading] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [converting, setConverting] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [previewElement, setPreviewElement] = useState<ReactNode | null>(null)

  if (!quote) {
    return (
      <NotFoundState
        title="Cotización no encontrada"
        backLabel="Volver a Cotizaciones"
        onBack={() => navigate("/cotizaciones")}
      />
    )
  }

  const totals = quoteTotals(quote)
  const showDiscount = totals.discount > 0.004
  const showTax = quote.taxRate > 0
  const deposit = Number(quote.deposit) || 0
  const showDeposit = deposit > 0

  const handleStatusChange = (status: QuoteStatus) => {
    updateQuote(quote.id, { status })
    toast.success(`Cotización marcada como “${status}”.`)
  }

  const handleDownload = async () => {
    setDownloading(true)
    try {
      await downloadQuotePdf(quote, quoteFormat)
      toast.success("PDF descargado.")
    } catch {
      toast.error("No se pudo generar el PDF.")
    } finally {
      setDownloading(false)
    }
  }

  const handlePreview = async () => {
    setPreviewOpen(true)
    if (previewElement) return
    setPreviewLoading(true)
    try {
      const [
        { PDFViewer },
        { QuotePDFDocument, loadLogoAsDataUri, LOGO_URL, WATERMARK_URL },
      ] = await Promise.all([
        import("@react-pdf/renderer"),
        import("@/lib/quote-pdf-document"),
      ])
      const logoDataUri = await loadLogoAsDataUri(LOGO_URL)
      const watermarkDataUri = await loadLogoAsDataUri(WATERMARK_URL)
      setPreviewElement(
        <PDFViewer style={{ width: "100%", height: "70vh" }} showToolbar>
          <QuotePDFDocument
            quote={quote}
            quoteFormat={quoteFormat}
            logoDataUri={logoDataUri}
            watermarkDataUri={watermarkDataUri}
          />
        </PDFViewer>,
      )
    } catch {
      toast.error("No se pudo abrir la vista previa.")
    } finally {
      setPreviewLoading(false)
    }
  }

  const handleConvert = () => {
    if (converting) return
    setConverting(true)
    try {
      const lines = quote.items.map((i) => `• ${i.name}${i.description ? ` (${i.description})` : ""}`).join("\n")
      const projectId = addProject({
        clientId: quote.clientId ?? "",
        name: `Cotización ${quote.code}`,
        totalPrice: totals.total,
        description: `Proyecto generado desde la cotización ${quote.code}.\n\n${lines}`,
        status: "Pendiente de inicio",
        deliveryDate: null,
        lastUpdated: new Date().toISOString(),
        thumbnailBase64: null,
        sourceQuoteId: quote.id,
      })
      toast.success("Proyecto creado desde la cotización.")
      navigate(`/proyectos/${projectId}`)
    } catch {
      toast.error("No se pudo crear el proyecto.")
      setConverting(false)
    }
  }

  const handleWhatsApp = () => {
    const message = encodeURIComponent(
      `Hola ${quote.clientName}, te comparto mi cotización ${quote.code} por un total de ${formatCurrency(totals.total)}. ¡Quedo atenta a tus comentarios!`,
    )
    const number = quote.clientPhone.replace(/[^0-9]/g, "")
    const safeNumber = number.length >= 10 ? number : "5215512345678"
    window.open(`https://wa.me/${safeNumber}?text=${message}`, "_blank")
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <BackButton label="Volver a Cotizaciones" onClick={() => navigate("/cotizaciones")} />
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => navigate(`/cotizaciones/${quote.id}/editar`)}>
            <Pencil aria-hidden /> Editar
          </Button>
          <WhatsAppButton label="Enviar por WhatsApp" onClick={handleWhatsApp} />
          <Button variant="outline" onClick={() => void handlePreview()}>
            <Eye aria-hidden /> {previewLoading ? "Cargando…" : "Vista previa"}
          </Button>
          <Button onClick={handleDownload} disabled={downloading}>
            <Download aria-hidden /> {downloading ? "Generando…" : "Descargar PDF"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-start justify-between">
              <div>
                <CardTitle className="text-2xl">{quote.clientName}</CardTitle>
                <CardDescription className="mt-1">
                  {quote.code} · Creada el {formatDate(quote.createdAt)}
                  {quote.validUntil && (
                    <>
                      {" · "}Vigencia hasta <strong className="text-foreground">{formatDate(quote.validUntil)}</strong>
                    </>
                  )}
                </CardDescription>
              </div>
              <QuoteStatusBadge status={quote.status} />
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>
                Teléfono: <strong className="text-foreground">{quote.clientPhone || "—"}</strong>
              </p>
              {quote.clientEmail && (
                <p>
                  Correo: <strong className="text-foreground">{quote.clientEmail}</strong>
                </p>
              )}
              {quote.eventTypeName && (
                <p>
                  Tipo de evento: <strong className="text-foreground">{quote.eventTypeName}</strong>
                </p>
              )}
              {quote.clientId && (
                <Button
                  variant="link"
                  size="sm"
                  className="-ml-3 h-auto p-0"
                  onClick={() => navigate(`/clientes/${quote.clientId}`)}
                >
                  Ver ficha del cliente <ArrowRight className="size-3.5" aria-hidden />
                </Button>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Conceptos</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Concepto</TableHead>
                    <TableHead className="text-center">Cant.</TableHead>
                    <TableHead className="text-right">P. unitario</TableHead>
                    <TableHead className="text-right">Importe</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {quote.items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="font-medium text-foreground">{item.name}</div>
                        {item.description && (
                          <div className="text-xs text-muted-foreground">{item.description}</div>
                        )}
                      </TableCell>
                      <TableCell className="text-center">{item.quantity}</TableCell>
                      <TableCell className="text-right">{formatCurrency(item.unitPrice)}</TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(item.quantity * item.unitPrice)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="mt-4 space-y-1 border-t pt-4 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span>{formatCurrency(totals.subtotal)}</span>
                </div>
                {showDiscount && (
                  <div className="flex justify-between text-muted-foreground">
                    <span>
                      Descuento (
                      {quote.discountType === "percent" ? `${quote.discountValue}%` : "fijo"})
                    </span>
                    <span className="font-medium text-destructive">-{formatCurrency(totals.discount)}</span>
                  </div>
                )}
                {showTax && (
                  <div className="flex justify-between text-muted-foreground">
                    <span>Impuesto ({quote.taxRate}%)</span>
                    <span>{formatCurrency(totals.tax)}</span>
                  </div>
                )}
                <div className={cn("flex justify-between border-t pt-2")}>
                  <span className="font-semibold text-foreground">Total</span>
                  <span className="text-xl font-bold text-primary">{formatCurrency(totals.total)}</span>
                </div>
                {showDeposit && (
                  <>
                    <div className="flex justify-between border-t pt-2 font-medium text-emerald-600 dark:text-emerald-400">
                      <span>Anticipo pagado</span>
                      <span>-{formatCurrency(deposit)}</span>
                    </div>
                    <div className="flex justify-between rounded-lg bg-emerald-50 px-3 py-2 font-semibold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                      <span>Saldo por pagar</span>
                      <span>{formatCurrency(Math.max(0, totals.total - deposit))}</span>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {quote.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Notas</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap text-sm text-muted-foreground">{quote.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarClock className="size-5 text-primary" aria-hidden /> Estado
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={quote.status} onValueChange={(v) => handleStatusChange(v as QuoteStatus)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {QUOTE_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="mt-3 text-xs text-muted-foreground">
                Cambia el estado para llevar el seguimiento con tu cliente.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Acciones</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant="outline"
                className="w-full"
                disabled={!quote.clientId}
                onClick={handleConvert}
              >
                <FolderPlus aria-hidden /> Convertir en proyecto
              </Button>
              <Button
                variant="outline"
                className="w-full border-red-200 bg-red-50 text-red-600 hover:bg-red-100 dark:border-red-900 dark:bg-red-950/40 dark:text-red-400 dark:hover:bg-red-950/70"
                onClick={() => setConfirmDelete(true)}
              >
                <Trash2 aria-hidden /> Eliminar cotización
              </Button>
            </CardContent>
          </Card>

          <Card className="border-primary/30 bg-primary/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <FileText className="size-4 text-primary" aria-hidden /> Recordatorio
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Imprime este vale de cotización o conviértelo en proyecto para vincularlo a pagos y
              entregas.
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Vista previa · {quote.code}</DialogTitle>
            <DialogDescription>
              Así se verá el PDF que compartes con tu cliente.
            </DialogDescription>
          </DialogHeader>
          {previewLoading && (
            <div className="flex h-[70vh] items-center justify-center">
              <p className="text-sm text-muted-foreground">Generando vista previa…</p>
            </div>
          )}
          {!previewLoading && previewElement}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Eliminar cotización"
        description={`¿Deseas eliminar la cotización ${quote.code} de ${quote.clientName}? Esta acción no se puede deshacer.`}
        confirmLabel="Sí, eliminar"
        destructive
        onConfirm={() => {
          deleteQuote(quote.id)
          toast.success("Cotización eliminada.")
          navigate("/cotizaciones")
        }}
      />
    </div>
  )
}