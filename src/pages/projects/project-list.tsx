import { FolderKanban, Plus } from "lucide-react"
import { useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"

import { EmptyState } from "@/components/common/empty-state"
import { LoadMoreButton } from "@/components/common/load-more-button"
import { PageHeader } from "@/components/common/page-header"
import { ProjectCard } from "@/components/common/project-card"
import { SearchInput } from "@/components/common/search-input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useLoadMore } from "@/hooks/useLoadMore"
import { PROJECT_STATUSES } from "@/lib/types"
import type { ProjectWithBalance } from "@/lib/types"
import { formatCurrency } from "@/lib/utils"
import { useAppStore } from "@/stores/useAppStore"

export default function ProjectList() {
  const navigate = useNavigate()
  const projects = useAppStore((s) => s.projects)
  const payments = useAppStore((s) => s.payments)
  const clients = useAppStore((s) => s.clients)

  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")

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
      const matchesStatus = statusFilter === "all" || project.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [allEnriched, search, statusFilter, clientNames])

  const { visible, hasMore, loadMore } = useLoadMore(enriched, 9, search, statusFilter)

  const totalAgreed = allEnriched.reduce((sum, p) => sum + p.totalPrice, 0)
  const totalCollected = allEnriched.reduce((sum, p) => sum + p.totalPaid, 0)

  return (
    <div className="space-y-6">
      <PageHeader title="Proyectos" description="Administra todos tus proyectos en un solo lugar.">
        <Button onClick={() => navigate("/proyectos/nuevo")}>
          <Plus aria-hidden /> Nuevo Proyecto
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-xl bg-muted/50 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Proyectos</p>
          <p className="mt-1 text-xl font-bold text-foreground">{allEnriched.length}</p>
        </div>
        <div className="rounded-xl bg-muted/50 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Acordado</p>
          <p className="mt-1 text-xl font-bold text-foreground">{formatCurrency(totalAgreed)}</p>
        </div>
        <div className="rounded-xl bg-muted/50 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Cobrado</p>
          <p className="mt-1 text-xl font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(totalCollected)}</p>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Buscar por nombre de proyecto o cliente…"
          ariaLabel="Buscar proyectos"
        />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="sm:w-56" aria-label="Filtrar por estado">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            {PROJECT_STATUSES.map((status) => (
              <SelectItem key={status} value={status}>
                {status}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {enriched.length > 0 ? (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {visible.map((p) => (
              <ProjectCard key={p.id} project={p} clientName={clientNames.get(p.clientId) ?? "Sin cliente"} />
            ))}
          </div>
          {hasMore && (
            <LoadMoreButton onClick={loadMore} remaining={enriched.length - visible.length} />
          )}
        </>
      ) : (
        <EmptyState
          icon={FolderKanban}
          title={allEnriched.length === 0 ? "Aún no tienes proyectos" : "Sin coincidencias"}
          description={
            allEnriched.length === 0
              ? "Crea tu primer proyecto para comenzar a organizar tu trabajo."
              : "Intenta con otro nombre o estado."
          }
          action={
            allEnriched.length === 0
              ? {
                  label: "Crear primer proyecto",
                  icon: Plus,
                  onClick: () => navigate("/proyectos/nuevo"),
                }
              : undefined
          }
        />
      )}
    </div>
  )
}