import { FileText, MessageSquareText, Save } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

import { PageHeader } from "@/components/common/page-header"
import { TokenTextarea } from "@/components/common/token-textarea"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { DEFAULT_QUOTE_FORMAT } from "@/lib/constants"
import { PROJECT_STATUSES } from "@/lib/types"
import type { QuoteFormatSettings } from "@/lib/types"
import { useAppStore } from "@/stores/useAppStore"

export default function Settings() {
  const messages = useAppStore((s) => s.settings.messages) ?? {}
  const quoteFormat = useAppStore((s) => s.settings.quoteFormat)
  const updateMessage = useAppStore((s) => s.updateMessage)
  const updateQuoteFormat = useAppStore((s) => s.updateQuoteFormat)
  const [drafts, setDrafts] = useState<Record<string, string>>(messages)
  const [formatDraft, setFormatDraft] = useState<QuoteFormatSettings>({
    ...DEFAULT_QUOTE_FORMAT,
    ...quoteFormat,
  })

  const saveAll = () => {
    for (const status of PROJECT_STATUSES) {
      updateMessage(status, drafts[status] ?? "")
    }
    toast.success("Plantillas de mensaje guardadas.")
  }

  const saveFormat = () => {
    updateQuoteFormat({
      businessName: formatDraft.businessName.trim() || DEFAULT_QUOTE_FORMAT.businessName,
      address: formatDraft.address.trim(),
      phone: formatDraft.phone.trim(),
      mapsUrl: formatDraft.mapsUrl.trim(),
      whatsappMessage: formatDraft.whatsappMessage.trim(),
      validityText: formatDraft.validityText.trim(),
      footerText: formatDraft.footerText.trim(),
    })
    toast.success("Formato de cotización guardado.")
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Ajustes"
        description="Personaliza las plantillas de mensajes y el formato de tus cotizaciones."
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquareText className="size-5 text-primary" aria-hidden />
            Plantillas por estado
          </CardTitle>
          <CardDescription>
            Usa{" "}
            <code className="rounded bg-muted px-1 text-xs">[NOMBRE_CLIENTE]</code>,{" "}
            <code className="rounded bg-muted px-1 text-xs">[NOMBRE_PROYECTO]</code> y{" "}
            <code className="rounded bg-muted px-1 text-xs">[SALDO_PENDIENTE]</code> para
            reemplazarlos automáticamente al enviar.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {PROJECT_STATUSES.map((status) => (
            <div key={status} className="space-y-2 rounded-xl border border-transparent p-0 pb-2 sm:border-border sm:p-4">
              <Label htmlFor={`msg-${status.replace(/\s/g, "_")}`} className="text-base">
                {status}
              </Label>
              <TokenTextarea
                id={`msg-${status.replace(/\s/g, "_")}`}
                rows={3}
                value={drafts[status] ?? ""}
                onChange={(text) => setDrafts((d) => ({ ...d, [status]: text }))}
                placeholder="Escribe el mensaje con los placeholders…"
              />
            </div>
          ))}
          <div className="flex items-center justify-between gap-3 border-t pt-4">
            <p className="text-sm text-muted-foreground">
              Guarda todas las plantillas con un solo clic.
            </p>
            <Button onClick={saveAll}>
              <Save aria-hidden /> Guardar todo
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="size-5 text-primary" aria-hidden />
            Formato de Cotización
          </CardTitle>
          <CardDescription>
            Personaliza los datos que aparecen en el documento impreso de cada cotización.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="format-name">Encabezado (nombre del negocio)</Label>
              <Input
                id="format-name"
                value={formatDraft.businessName}
                onChange={(e) =>
                  setFormatDraft((d) => ({ ...d, businessName: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="format-address">Dirección</Label>
              <Input
                id="format-address"
                value={formatDraft.address}
                onChange={(e) => setFormatDraft((d) => ({ ...d, address: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="format-phone">Teléfono de la empresa</Label>
              <Input
                id="format-phone"
                value={formatDraft.phone}
                onChange={(e) => setFormatDraft((d) => ({ ...d, phone: e.target.value }))}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="format-maps">Enlace de Google Maps (dirección)</Label>
              <Input
                id="format-maps"
                type="url"
                value={formatDraft.mapsUrl}
                onChange={(e) => setFormatDraft((d) => ({ ...d, mapsUrl: e.target.value }))}
                placeholder="https://maps.app.goo.gl/…"
              />
              <p className="text-xs text-muted-foreground">
                Al hacer clic en la dirección del PDF se abre este enlace.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="format-whatsapp">Mensaje predeterminado de WhatsApp</Label>
              <Input
                id="format-whatsapp"
                value={formatDraft.whatsappMessage}
                onChange={(e) =>
                  setFormatDraft((d) => ({ ...d, whatsappMessage: e.target.value }))
                }
              />
              <p className="text-xs text-muted-foreground">
                Se envía al hacer clic en el teléfono del PDF.
              </p>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="format-validity">Texto de vigencia</Label>
            <Textarea
              id="format-validity"
              rows={3}
              value={formatDraft.validityText}
              onChange={(e) =>
                setFormatDraft((d) => ({ ...d, validityText: e.target.value }))
              }
            />
            <p className="text-xs text-muted-foreground">
              Se muestra al final del documento de la cotización.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="format-footer">Leyenda inferior</Label>
            <Textarea
              id="format-footer"
              rows={5}
              value={formatDraft.footerText}
              onChange={(e) =>
                setFormatDraft((d) => ({ ...d, footerText: e.target.value }))
              }
              className="uppercase"
            />
            <p className="text-xs text-muted-foreground">
              Texto que aparece en la parte de abajo, como leyenda de pago.
            </p>
          </div>
          <div className="flex items-center justify-between gap-3 border-t pt-4">
            <p className="text-sm text-muted-foreground">
              Estos datos se verán reflejados en el PDF de tus cotizaciones.
            </p>
            <Button onClick={saveFormat}>
              <Save aria-hidden /> Guardar formato
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}