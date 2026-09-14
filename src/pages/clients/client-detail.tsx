import {
  BadgeCheck,
  CalendarDays,
  FolderOpen,
  Mail,
  MessageCircle,
  Pencil,
  Plus,
  Trash2,
  Wallet,
} from "lucide-react"
import { useMemo, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"

import { BackButton } from "@/components/common/back-button"
import { ClientAvatar } from "@/components/common/client-avatar"
import { ConfirmDialog } from "@/components/common/confirm-dialog"
import { FormField } from "@/components/common/form-field"
import { NotFoundState } from "@/components/common/not-found-state"
import { ProjectCard } from "@/components/common/project-card"
import { ToggleRow } from "@/components/common/toggle-row"
import { WhatsAppButton } from "@/components/common/whatsapp-button"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { calculateProjectBalance, isProjectActive } from "@/lib/calc"
import { formatCurrency, formatDate } from "@/lib/utils"
import { generateWhatsAppLink } from "@/lib/whatsapp"
import { useAppStore } from "@/stores/useAppStore"
import { cn } from "@/lib/utils"
import type { ProjectWithBalance } from "@/lib/types"

function MetricCard({
  icon: Icon,
  label,
  value,
  valueClassName,
}: {
  icon: typeof Wallet
  label: string
  value: string
  valueClassName?: string
}) {
  return (
    <div className="rounded-2xl border bg-card p-5">
      <div className="mb-3 flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <Icon className="size-5" aria-hidden />
      </div>
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <p className={cn("mt-1 text-2xl font-bold text-foreground", valueClassName)}>{value}</p>
    </div>
  )
}

export default function ClientDetail() {
  const { id = "" } = useParams()
  const navigate = useNavigate()

  const client = useAppStore((s) => s.clients.find((c) => c.id === id))
  const projects = useAppStore((s) => s.projects)
  const payments = useAppStore((s) => s.payments)
  const settings = useAppStore((s) => s.settings)
  const updateClient = useAppStore((s) => s.updateClient)
  const deleteClient = useAppStore((s) => s.deleteClient)

  const [editOpen, setEditOpen] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [tab, setTab] = useState("all")

  const clientProjects = useMemo<ProjectWithBalance[]>(() => {
    return projects
      .filter((p) => p.clientId === id)
      .map((p) => ({ ...p, ...calculateProjectBalance(p, payments) }))
  }, [projects, payments, id])

  const activeProjects = clientProjects.filter((p) => isProjectActive(p.status))
  const completedProjects = clientProjects.filter((p) => !isProjectActive(p.status))

  const totalBalance = clientProjects.reduce((sum, p) => sum + p.balance, 0)
  const totalFacturado = clientProjects.reduce((sum, p) => sum + p.totalPaid, 0)

  if (!client) {
    return (
      <NotFoundState
        title="Cliente no encontrado"
        backLabel="Volver a Clientes"
        onBack={() => navigate("/clientes")}
      />
    )
  }

  const visibleProjects =
    tab === "active" ? activeProjects : tab === "completed" ? completedProjects : clientProjects

  const handleDelete = () => {
    deleteClient(client.id)
    navigate("/clientes")
  }

  return (
    <div className="space-y-6">
      <BackButton label="Volver a Clientes" onClick={() => navigate("/clientes")} />

      <Card>
        <CardContent className="flex flex-col gap-6 !pt-6 md:flex-row md:items-start md:justify-between">
          <div className="flex flex-col gap-5 md:flex-row md:items-center">
            <div className="rounded-full bg-gradient-to-br from-primary to-[#a7c4dd] p-1">
              <div className="rounded-full bg-card p-1">
                <ClientAvatar name={client.name} photoBase64={client.photoBase64} size="xl" />
              </div>
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl font-bold text-foreground sm:text-3xl">{client.name}</h1>
                <span
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold",
                    client.isActive
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                      : "bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-300",
                  )}
                >
                  {client.isActive ? <BadgeCheck className="size-3.5" aria-hidden /> : null}
                  {client.isActive ? "Activo" : "Inactivo"}
                </span>
              </div>
              <div className="mt-2 space-y-1.5 text-sm text-muted-foreground">
                <p className="flex items-center gap-2">
                  <MessageCircle className="size-4" aria-hidden /> {client.whatsapp_number}
                </p>
                {client.email && (
                  <p className="flex items-center gap-2">
                    <Mail className="size-4" aria-hidden />
                    <a href={`mailto:${client.email}`} className="font-medium text-foreground hover:underline">
                      {client.email}
                    </a>
                  </p>
                )}
                <p className="flex items-center gap-2">
                  <CalendarDays className="size-4" aria-hidden />
                  Cliente desde:{" "}
                  <strong className="font-semibold text-foreground">
                    {formatDate(client.creationDate)}
                  </strong>
                </p>
              </div>
            </div>
          </div>

          <div className="flex w-full flex-col gap-2 md:w-auto">
            <Button variant="outline" onClick={() => setEditOpen(true)}>
              <Pencil aria-hidden /> Editar Cliente
            </Button>
            <WhatsAppButton
              onClick={() => window.open(generateWhatsAppLink(client, settings), "_blank")}
            >
              <MessageCircle aria-hidden /> Iniciar Chat
            </WhatsAppButton>
            <Button
              variant="outline"
              className="border-red-200 bg-red-50 text-red-600 hover:bg-red-100 dark:border-red-900 dark:bg-red-950/40 dark:text-red-400 dark:hover:bg-red-950/70"
              onClick={() => setConfirmDelete(true)}
            >
              <Trash2 aria-hidden /> Eliminar Cliente
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <MetricCard
          icon={FolderOpen}
          label="Proyectos Activos"
          value={String(activeProjects.length)}
        />
        <MetricCard
          icon={Wallet}
          label="Saldo Pendiente"
          value={formatCurrency(totalBalance)}
          valueClassName={totalBalance > 0.01 ? "text-destructive" : "text-emerald-600 dark:text-emerald-400"}
        />
        <MetricCard
          icon={BadgeCheck}
          label="Total Facturado"
          value={formatCurrency(totalFacturado)}
          valueClassName="text-emerald-600 dark:text-emerald-400"
        />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Proyectos ({clientProjects.length})</CardTitle>
          <Button size="sm" onClick={() => navigate(`/proyectos/nuevo?cliente=${client.id}`)}>
            <Plus aria-hidden /> Nuevo Proyecto
          </Button>
        </CardHeader>
        <CardContent>
          <Tabs value={tab} onValueChange={setTab} className="w-full">
            <TabsList className="mb-4 w-full sm:w-auto">
              <TabsTrigger value="all">Todos ({clientProjects.length})</TabsTrigger>
              <TabsTrigger value="active">Activos ({activeProjects.length})</TabsTrigger>
              <TabsTrigger value="completed">Completados ({completedProjects.length})</TabsTrigger>
            </TabsList>
            <TabsContent value={tab} className="mt-0 space-y-3">
              {visibleProjects.length > 0 ? (
                visibleProjects.map((p) => (
                  <ProjectCard key={p.id} project={p} clientName={client.name} />
                ))
              ) : (
                <p className="py-8 text-center text-muted-foreground">No hay proyectos en esta sección.</p>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="text-sm text-muted-foreground">
          {clientProjects.length === 0 && "Este cliente aún no tiene proyectos registrados."}
        </CardFooter>
      </Card>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Cliente</DialogTitle>
            <DialogDescription>Actualiza la información de contacto del cliente.</DialogDescription>
          </DialogHeader>
          <EditClientForm
            key={client.id}
            initialName={client.name}
            initialWhatsapp={client.whatsapp_number}
            initialEmail={client.email ?? ""}
            initialActive={client.isActive}
            onSave={(data) => {
              updateClient(client.id, data)
              setEditOpen(false)
            }}
          />
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Eliminar Cliente"
        description={
          <>
            <p>
              ¿Estás segura de eliminar al cliente <strong>“{client.name}”</strong>?
            </p>
            <p className="font-semibold text-destructive">
              Esta acción eliminará TODOS sus proyectos y pagos asociados. No se puede deshacer.
            </p>
          </>
        }
        confirmLabel="Sí, eliminar todo"
        destructive
        onConfirm={handleDelete}
      />
    </div>
  )
}

function EditClientForm({
  initialName,
  initialWhatsapp,
  initialEmail,
  initialActive,
  onSave,
}: {
  initialName: string
  initialWhatsapp: string
  initialEmail: string
  initialActive: boolean
  onSave: (data: { name: string; whatsapp_number: string; email: string; isActive: boolean }) => void
}) {
  const [name, setName] = useState(initialName)
  const [whatsapp, setWhatsapp] = useState(initialWhatsapp)
  const [email, setEmail] = useState(initialEmail)
  const [isActive, setIsActive] = useState(initialActive)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !whatsapp.trim()) return
    onSave({
      name: name.trim(),
      whatsapp_number: whatsapp.trim(),
      email: email.trim(),
      isActive,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <FormField label="Nombre" htmlFor="edit-name" required>
        <Input id="edit-name" value={name} onChange={(e) => setName(e.target.value)} required />
      </FormField>
      <FormField label="WhatsApp" htmlFor="edit-whatsapp" required>
        <Input
          id="edit-whatsapp"
          value={whatsapp}
          onChange={(e) => setWhatsapp(e.target.value)}
          placeholder="+52 55 1234 5678"
          required
        />
      </FormField>
      <FormField label="Correo Electrónico" htmlFor="edit-email">
        <Input id="edit-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      </FormField>
      <ToggleRow
        title="Cliente activo"
        hint="Los clientes inactivos aparecen resaltados."
        checked={isActive}
        onChange={setIsActive}
      />
      <div className="flex justify-end gap-2 pt-2">
        <Button type="submit">Guardar cambios</Button>
      </div>
    </form>
  )
}