import { MessageCircle, Plus, UserPlus, Users } from "lucide-react"
import { useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"

import { ClientAvatar } from "@/components/common/client-avatar"
import { EmptyState } from "@/components/common/empty-state"
import { LoadMoreButton } from "@/components/common/load-more-button"
import { PageHeader } from "@/components/common/page-header"
import { SearchInput } from "@/components/common/search-input"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useLoadMore } from "@/hooks/useLoadMore"
import { calculateProjectBalance, isProjectActive } from "@/lib/calc"
import { formatCurrency } from "@/lib/utils"
import { generateWhatsAppLink } from "@/lib/whatsapp"
import { useAppStore } from "@/stores/useAppStore"
import type { ClientWithSummary } from "@/lib/types"
import { cn } from "@/lib/utils"

export default function ClientList() {
  const clients = useAppStore((s) => s.clients)
  const projects = useAppStore((s) => s.projects)
  const payments = useAppStore((s) => s.payments)
  const settings = useAppStore((s) => s.settings)
  const navigate = useNavigate()
  const [search, setSearch] = useState("")

  const rows = useMemo<ClientWithSummary[]>(() => {
    const term = search.trim().toLowerCase()
    return clients
      .map((client) => {
        const clientProjects = projects
          .filter((p) => p.clientId === client.id)
          .map((p) => ({
            ...p,
            ...calculateProjectBalance(p, payments),
          }))
        const activeCount = clientProjects.filter((p) => isProjectActive(p.status)).length
        const totalBalance = clientProjects.reduce((sum, p) => sum + p.balance, 0)
        return { ...client, activeCount, totalBalance, totalProjects: clientProjects.length }
      })
      .filter((c) => {
        if (!term) return true
        return (
          c.name.toLowerCase().includes(term) ||
          (c.whatsapp_number && c.whatsapp_number.includes(term))
        )
      })
  }, [clients, projects, payments, search])

  const { visible, hasMore, loadMore } = useLoadMore(rows, 25, search)

  if (clients.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader title="Clientes" description="Gestiona a las personas que confían en Acuarela." />
        <EmptyState
          icon={Users}
          title="Lista de Clientes Vacía"
          description="Aún no has registrado ningún cliente. Comienza agregando uno nuevo."
          action={{ label: "Crear primer cliente", icon: UserPlus, onClick: () => navigate("/clientes/nuevo") }}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Clientes (${clients.length})`}
        description="Gestiona a las personas que confían en Acuarela."
      >
        <Button onClick={() => navigate("/clientes/nuevo")}>
          <Plus aria-hidden /> Crear Cliente
        </Button>
      </PageHeader>

      <SearchInput
        value={search}
        onChange={setSearch}
        placeholder="Buscar por nombre o WhatsApp"
        ariaLabel="Buscar clientes"
        icon={Users}
      />

      <div className="overflow-hidden rounded-2xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Contacto</TableHead>
              <TableHead>Métricas Operativas</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visible.map((client) => {
              const contact = client.whatsapp_number || client.email || ""
              return (
                <TableRow
                  key={client.id}
                  className="cursor-pointer"
                  onClick={() => navigate(`/clientes/${client.id}`)}
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <ClientAvatar name={client.name} photoBase64={client.photoBase64} size="md" />
                      <div className="min-w-0">
                        <p className="font-semibold text-foreground">{client.name}</p>
                        <p className="truncate text-sm text-muted-foreground">{contact}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="font-medium text-foreground">
                      {client.activeCount} trabajo{client.activeCount !== 1 ? "s" : ""} activo
                      {client.activeCount !== 1 ? "s" : ""}
                    </p>
                    <p
                      className={cn(
                        "text-sm",
                        client.totalBalance > 0.01 ? "font-medium text-destructive" : "text-muted-foreground",
                      )}
                    >
                      Saldo pendiente: {formatCurrency(client.totalBalance)}
                    </p>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          window.open(generateWhatsAppLink(client, settings), "_blank")
                        }}
                      >
                        <MessageCircle className="text-emerald-600 dark:text-emerald-400" aria-hidden /> WhatsApp
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          navigate(`/proyectos/nuevo?cliente=${client.id}`)
                        }}
                      >
                        <Plus aria-hidden /> Proyecto
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
        {hasMore && <LoadMoreButton onClick={loadMore} remaining={rows.length - visible.length} />}
        {rows.length === 0 && (
          <p className="flex items-center justify-center p-6 text-center text-muted-foreground">
            No se encontraron clientes con el criterio de búsqueda.
          </p>
        )}
      </div>
    </div>
  )
}