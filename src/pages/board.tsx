import { CalendarDays, Columns3, GripVertical, Plus, Search } from "lucide-react"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"

import { EmptyState } from "@/components/common/empty-state"
import { PageHeader } from "@/components/common/page-header"
import { SearchInput } from "@/components/common/search-input"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PROJECT_STATUSES } from "@/lib/types"
import type { ProjectStatus } from "@/lib/types"
import { cn, formatCurrency, formatDate } from "@/lib/utils"
import { isProjectPaid } from "@/lib/calc"
import { useAppStore } from "@/stores/useAppStore"
import type { ProjectWithBalance } from "@/lib/types"

/** Tinte suave de fondo para el cuerpo de cada columna. */
const COLUMN_TINTS: Record<ProjectStatus, string> = {
  "Pendiente de inicio": "bg-[#ebabc3]/15",
  "En proceso": "bg-[#9bd9d8]/15",
  "Pendiente de pago": "bg-[#d2abee]/15",
  "Por entregar": "bg-[#f7c5a2]/15",
  Entregado: "bg-emerald-50 dark:bg-emerald-950/40",
  Cancelado: "bg-red-50 dark:bg-red-950/40",
}

/** Color sólido y texto del encabezado, coherentes con la columna. */
const COLUMN_HEADERS: Record<ProjectStatus, { bg: string; text: string }> = {
  "Pendiente de inicio": { bg: "bg-[#ebabc3]", text: "text-[#1f2937]" },
  "En proceso": { bg: "bg-[#9bd9d8]", text: "text-[#1f2937]" },
  "Pendiente de pago": { bg: "bg-[#d2abee]", text: "text-[#1f2937]" },
  "Por entregar": { bg: "bg-[#f7c5a2]", text: "text-[#1f2937]" },
  Entregado: { bg: "bg-emerald-500", text: "text-white" },
  Cancelado: { bg: "bg-red-500", text: "text-white" },
}

type PaidFilter = "all" | "paid" | "pending"

/** Ordena los proyectos de una columna por order; sin order van al final (estables por fecha). */
function byBoardOrder(a: Pick<ProjectWithBalance, "order" | "creationDate">, b: Pick<ProjectWithBalance, "order" | "creationDate">): number {
  const ao = a.order ?? Number.MAX_SAFE_INTEGER
  const bo = b.order ?? Number.MAX_SAFE_INTEGER
  if (ao !== bo) return ao - bo
  return new Date(a.creationDate ?? 0).getTime() - new Date(b.creationDate ?? 0).getTime()
}

export default function Board() {
  const projects = useAppStore((s) => s.projects)
  const payments = useAppStore((s) => s.payments)
  const clients = useAppStore((s) => s.clients)
  const updateProject = useAppStore((s) => s.updateProject)
  const navigate = useNavigate()

  const [search, setSearch] = useState("")
  const [paidFilter, setPaidFilter] = useState<PaidFilter>("all")
  const scrollRef = useRef<HTMLDivElement>(null)
  const [scrolledToEnd, setScrolledToEnd] = useState(true)
  const [scrolledToStart, setScrolledToStart] = useState(true)

  const updateScroll = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    setScrolledToEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 2)
    setScrolledToStart(el.scrollLeft <= 2)
  }, [])

  useEffect(() => {
    window.addEventListener("resize", updateScroll)
    return () => window.removeEventListener("resize", updateScroll)
  }, [updateScroll])

  const clientNames = useMemo(() => new Map(clients.map((c) => [c.id, c.name])), [clients])

  const allEnriched = useMemo<ProjectWithBalance[]>(
    () =>
      projects.map((project) => {
        const totalPaid = payments
          .filter((p) => p.projectId === project.id)
          .reduce((sum, p) => sum + Number(p.amount || 0), 0)
        return {
          ...project,
          totalPaid: Number(totalPaid.toFixed(2)),
          balance: Number((project.totalPrice - totalPaid).toFixed(2)),
        }
      }),
    [projects, payments],
  )

  const enriched = useMemo(() => {
    const q = search.trim().toLowerCase()
    return allEnriched.filter((project) => {
      const matchesSearch =
        !q ||
        project.name.toLowerCase().includes(q) ||
        (clientNames.get(project.clientId) ?? "").toLowerCase().includes(q)
      const isPaid = isProjectPaid(project, project.balance)
      const matchesPaid = paidFilter === "all" || (paidFilter === "paid" ? isPaid : !isPaid)
      return matchesSearch && matchesPaid
    })
  }, [allEnriched, search, paidFilter, clientNames])

  useEffect(() => {
    updateScroll()
  }, [updateScroll, allEnriched, search, paidFilter])

  const reorderInColumn = (status: ProjectStatus, projectId: string, insertIndex?: number) => {
    const moved = allEnriched.find((p) => p.id === projectId)
    if (!moved) return
    const column = allEnriched
      .filter((p) => p.status === status && p.id !== projectId)
      .sort(byBoardOrder)
    const index =
      insertIndex == null ? column.length : Math.max(0, Math.min(insertIndex, column.length))
    const ordered = [...column.slice(0, index), moved, ...column.slice(index)]
    ordered.forEach((p, i) => {
      if (p.order !== i) updateProject(p.id, { order: i })
    })
  }

  const handleDrop = (status: ProjectStatus, projectId: string, insertIndex?: number) => {
    const project = allEnriched.find((p) => p.id === projectId)
    if (!project) return
    const changed = project.status !== status
    if (changed) {
      reorderInColumn(status, projectId, insertIndex)
      updateProject(projectId, { status })
      toast.success(`“${project.name}” movido a: ${status}`)
    } else if (insertIndex != null) {
      reorderInColumn(status, projectId, insertIndex)
    }
  }

  if (allEnriched.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Tablero"
          description="Organiza tus proyectos por estado, arrastra una tarjeta para moverla."
        />
        <EmptyState
          icon={Columns3}
          title="Aún no hay proyectos"
          description="Crea tu primer proyecto para verlo en el tablero."
          action={{ label: "Nuevo proyecto", onClick: () => navigate("/proyectos/nuevo"), icon: Plus }}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tablero"
        description="Organiza tus proyectos por estado; arrastra una tarjeta entre columnas."
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchInput value={search} onChange={setSearch} placeholder="Buscar por proyecto o cliente…" />
        <Select value={paidFilter} onValueChange={(v) => setPaidFilter(v as PaidFilter)}>
          <SelectTrigger className="w-full sm:w-52">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="paid">Pagados</SelectItem>
            <SelectItem value="pending">Con saldo pendiente</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {enriched.length === 0 ? (
        <EmptyState
          icon={Search}
          title="Sin resultados"
          description="Ningún proyecto coincide con tu búsqueda o filtro."
        />
      ) : (
        <div className="relative">
          <div
            ref={scrollRef}
            onScroll={updateScroll}
            className="grid auto-cols-[minmax(260px,320px)] grid-flow-col gap-4 overflow-x-auto pb-4"
          >
            {PROJECT_STATUSES.map((status) => {
              const columnProjects = enriched
                .filter((p) => p.status === status)
                .sort(byBoardOrder)
              return (
                <KanbanColumn
                  key={status}
                  status={status}
                  tintClass={COLUMN_TINTS[status]}
                  header={COLUMN_HEADERS[status]}
                  projects={columnProjects}
                  clientNames={clientNames}
                  onDrop={(projectId, insertIndex) => handleDrop(status, projectId, insertIndex)}
                />
              )
            })}
          </div>
          <div
            className={cn(
              "pointer-events-none absolute inset-y-0 left-0 w-6 bg-gradient-to-r from-background to-transparent transition-opacity duration-300 sm:w-10",
              scrolledToStart ? "opacity-0" : "opacity-100",
            )}
          />
          <div
            className={cn(
              "pointer-events-none absolute inset-y-0 right-0 w-6 bg-gradient-to-l from-background to-transparent transition-opacity duration-300 sm:w-10",
              scrolledToEnd ? "opacity-0" : "opacity-100",
            )}
          />
        </div>
      )}
    </div>
  )
}

function KanbanColumn({
  status,
  tintClass,
  header,
  projects,
  clientNames,
  onDrop,
}: {
  status: ProjectStatus
  tintClass: string
  header: { bg: string; text: string }
  projects: ProjectWithBalance[]
  clientNames: Map<string, string>
  onDrop: (projectId: string, insertIndex?: number) => void
}) {
  const [over, setOver] = useState(false)
  const [insert, setInsert] = useState<{ index: number; side: "before" | "after" } | null>(null)

  const insertionIndex = insert
    ? insert.side === "before"
      ? insert.index
      : insert.index + 1
    : undefined

  return (
    <section
      role="list"
      aria-label={status}
      onDragOver={(e) => {
        e.preventDefault()
        setOver(true)
      }}
      onDragEnter={(e) => {
        e.preventDefault()
        setOver(true)
      }}
      onDragLeave={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
          setOver(false)
          setInsert(null)
        }
      }}
      onDrop={(e) => {
        e.preventDefault()
        setOver(false)
        const id = e.dataTransfer.getData("text/plain")
        if (id) onDrop(id, insertionIndex)
        setInsert(null)
      }}
      className={cn(
        "flex max-h-[calc(100vh-14rem)] flex-col gap-3 rounded-2xl border bg-muted/40 p-3 transition-colors",
        tintClass,
        over && "ring-2 ring-primary/60",
      )}
    >
      <header
        className={cn(
          "flex items-center justify-between rounded-xl px-3 py-2 shadow-sm",
          header.bg,
          header.text,
        )}
      >
        <span className="text-sm font-bold uppercase tracking-wide">{status}</span>
        <span className="rounded-full bg-white/50 px-2 py-0.5 text-xs font-bold">
          {projects.length}
        </span>
      </header>

      <div className="flex flex-1 flex-col gap-3 overflow-y-auto">
        {projects.length > 0 ? (
          projects.map((project, index) => (
            <div key={project.id} className="relative">
              {insert?.index === index && insert.side === "before" && (
                <div className="absolute inset-x-0 -top-2 z-10 h-1 rounded-full bg-primary" aria-hidden />
              )}
              <BoardCard
                project={project}
                clientName={clientNames.get(project.clientId) ?? "Sin cliente"}
                onHover={(side) => setInsert({ index, side })}
              />
              {insert?.index === index && insert.side === "after" && (
                <div className="absolute inset-x-0 -bottom-2 z-10 h-1 rounded-full bg-primary" aria-hidden />
              )}
            </div>
          ))
        ) : (
          <div className="rounded-xl border border-dashed border-foreground/15 p-4 text-center text-xs text-muted-foreground">
            Sin proyectos
          </div>
        )}
        {insert && insertionIndex != null && insertionIndex >= projects.length && (
          <div className="h-1 rounded-full bg-primary" aria-hidden />
        )}
      </div>
    </section>
  )
}

function BoardCard({
  project,
  clientName,
  onHover,
}: {
  project: ProjectWithBalance
  clientName: string
  onHover: (side: "before" | "after") => void
}) {
  const navigate = useNavigate()
  const total = Number(project.totalPrice)
  const percentPaid = total > 0 ? Math.min((project.totalPaid / total) * 100, 100) : 100
  const paid = isProjectPaid(project, project.balance)
  const hasBalance = project.balance > 0.01 && !paid

  return (
    <Card
      role="listitem"
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("text/plain", project.id)
        e.dataTransfer.effectAllowed = "move"
      }}
      onDragOver={(e) => {
        e.preventDefault()
        const rect = e.currentTarget.getBoundingClientRect()
        onHover(e.clientY < rect.top + rect.height / 2 ? "before" : "after")
      }}
      onClick={() => navigate(`/proyectos/${project.id}`)}
      className={cn(
        "cursor-pointer select-none space-y-2 p-3 transition-shadow hover:shadow-md",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate font-semibold text-foreground">{project.name}</p>
          <p className="truncate text-xs text-muted-foreground">{clientName}</p>
        </div>
        <GripVertical className="mt-0.5 size-4 shrink-0 text-muted-foreground/50" aria-hidden />
      </div>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
        <span className="flex items-center gap-1 text-muted-foreground">
          <CalendarDays className="size-3.5" aria-hidden />
          {formatDate(project.deliveryDate)}
        </span>
        <span className={cn(hasBalance ? "font-semibold text-destructive" : "font-semibold text-emerald-600 dark:text-emerald-400")}>
          {formatCurrency(project.balance)} {hasBalance ? "pendiente" : "saldo pagado"}
        </span>
      </div>

      <Progress
        className="h-1.5"
        value={percentPaid}
        indicatorClassName={hasBalance ? "bg-destructive" : "bg-emerald-500"}
      />
    </Card>
  )
}