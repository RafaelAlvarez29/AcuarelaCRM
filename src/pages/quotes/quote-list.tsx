import { Download, FileText, Plus, Search } from "lucide-react"
import { useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"

import { EmptyState } from "@/components/common/empty-state"
import { LoadMoreButton } from "@/components/common/load-more-button"
import { PageHeader } from "@/components/common/page-header"
import { SearchInput } from "@/components/common/search-input"
import { QuoteStatusBadge } from "@/components/common/status-badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useLoadMore } from "@/hooks/useLoadMore"
import { quoteTotals } from "@/lib/calc"
import { downloadQuotePdf } from "@/lib/quote-pdf"
import type { Quote, QuoteStatus } from "@/lib/types"
import { QUOTE_STATUSES } from "@/lib/types"
import { cn, formatCurrency, formatDate } from "@/lib/utils"
import { useAppStore } from "@/stores/useAppStore"

export default function QuoteList() {
  const quotes = useAppStore((s) => s.quotes)
  const navigate = useNavigate()

  const [search, setSearch] = useState("")
  const [status, setStatus] = useState<"all" | QuoteStatus>("all")

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return [...quotes]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .filter((quote) => {
        const matchesSearch =
          !q ||
          quote.code.toLowerCase().includes(q) ||
          quote.clientName.toLowerCase().includes(q)
        const matchesStatus = status === "all" || quote.status === status
        return matchesSearch && matchesStatus
      })
  }, [quotes, search, status])

  const { visible, hasMore, loadMore } = useLoadMore(filtered, 9, search, status)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Cotizaciones"
        description="Crea, envía y da seguimiento a tus cotizaciones."
      >
        <Button onClick={() => navigate("/cotizaciones/nueva")}>
          <Plus aria-hidden /> Nueva Cotización
        </Button>
      </PageHeader>

      <div className="flex flex-col gap-3 sm:flex-row">
        <SearchInput value={search} onChange={setSearch} placeholder="Buscar por código o cliente…" />
        <div className="flex flex-wrap gap-2">
          <StatusFilterChip active={status === "all"} onClick={() => setStatus("all")}>
            Todas
          </StatusFilterChip>
          {QUOTE_STATUSES.map((s) => (
            <StatusFilterChip key={s} active={status === s} onClick={() => setStatus(s)}>
              {s}
            </StatusFilterChip>
          ))}
        </div>
      </div>

      {filtered.length > 0 ? (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {visible.map((quote) => (
              <QuoteCard key={quote.id} quote={quote} onView={() => navigate(`/cotizaciones/${quote.id}`)} />
            ))}
          </div>
          {hasMore && <LoadMoreButton onClick={loadMore} remaining={filtered.length - visible.length} />}
        </>
      ) : quotes.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="Aún no hay cotizaciones"
          description="Crea tu primera cotización a partir de un cliente o de un proyecto."
          action={{ label: "Nueva cotización", onClick: () => navigate("/cotizaciones/nueva"), icon: Plus }}
        />
      ) : (
        <EmptyState
          icon={Search}
          title="Sin resultados"
          description="Ninguna cotización coincide con tu búsqueda o filtro."
        />
      )}
    </div>
  )
}

function StatusFilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-background text-muted-foreground hover:bg-muted",
      )}
    >
      {children}
    </button>
  )
}

function QuoteCard({ quote, onView }: { quote: Quote; onView: () => void }) {
  const totals = quoteTotals(quote)
  const quoteFormat = useAppStore((s) => s.settings.quoteFormat)
  const [downloading, setDownloading] = useState(false)

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation()
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

  return (
    <Card
      role="button"
      tabIndex={0}
      onClick={onView}
      onKeyDown={(e) => e.key === "Enter" && onView()}
      className="cursor-pointer transition-shadow hover:shadow-md"
    >
      <CardContent className="space-y-3 p-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="rounded bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary">
              {quote.code}
            </span>
            <QuoteStatusBadge status={quote.status} />
          </div>
          <span className="text-xs text-muted-foreground">{formatDate(quote.createdAt)}</span>
        </div>
        <div>
          <p className="truncate font-semibold text-foreground">{quote.clientName}</p>
          <p className="text-xs text-muted-foreground">
            {quote.items.length} {quote.items.length === 1 ? "concepto" : "conceptos"}
          </p>
        </div>
        <div className="flex items-center justify-between">
          <p className="text-lg font-bold text-primary">{formatCurrency(totals.total)}</p>
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground"
            onClick={(e) => void handleDownload(e)}
            aria-label={`Descargar PDF de ${quote.code}`}
          >
            <Download className="size-4" aria-hidden /> {downloading ? "…" : "PDF"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}