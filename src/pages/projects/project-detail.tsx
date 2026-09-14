import {
  CalendarDays,
  CheckCircle2,
  FileText,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react"
import { useMemo, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { toast } from "sonner"

import { BackButton } from "@/components/common/back-button"
import { ConfirmDialog } from "@/components/common/confirm-dialog"
import { FormField } from "@/components/common/form-field"
import { ImagePicker } from "@/components/common/image-picker"
import { NotFoundState } from "@/components/common/not-found-state"
import { ProjectStatusBadge } from "@/components/common/status-badge"
import { ToggleRow } from "@/components/common/toggle-row"
import { WhatsAppButton } from "@/components/common/whatsapp-button"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { calculateProjectBalance } from "@/lib/calc"
import { formatCurrency, formatDate, toDateInputValue } from "@/lib/utils"
import { generateWhatsAppLink } from "@/lib/whatsapp"
import { useAppStore } from "@/stores/useAppStore"
import { cn } from "@/lib/utils"
import { PROJECT_STATUSES } from "@/lib/types"
import type { ProjectStatus } from "@/lib/types"

export default function ProjectDetail() {
  const { id = "" } = useParams()
  const navigate = useNavigate()

  const project = useAppStore((s) => s.projects.find((p) => p.id === id))
  const client = useAppStore((s) => s.clients.find((c) => c.id === project?.clientId))
  const payments = useAppStore((s) => s.payments)
  const settings = useAppStore((s) => s.settings)
  const sourceQuote = useAppStore((s) =>
    project?.sourceQuoteId ? s.quotes.find((q) => q.id === project.sourceQuoteId) : undefined,
  )
  const updateProject = useAppStore((s) => s.updateProject)
  const deleteProject = useAppStore((s) => s.deleteProject)
  const addPayment = useAppStore((s) => s.addPayment)
  const removePayment = useAppStore((s) => s.removePayment)

  const [amount, setAmount] = useState("")
  const [editOpen, setEditOpen] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [paymentToDelete, setPaymentToDelete] = useState<string | null>(null)

  const projectPayments = useMemo(
    () =>
      payments
        .filter((p) => p.projectId === id)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [payments, id],
  )

  if (!project) {
    return (
      <NotFoundState
        title="Proyecto no encontrado"
        backLabel="Volver al Dashboard"
        onBack={() => navigate("/")}
      />
    )
  }

  const { totalPaid, balance } = calculateProjectBalance(project, payments)
  const percentPaid = project.totalPrice > 0 ? Math.min((totalPaid / project.totalPrice) * 100, 100) : 100
  const hasBalance = balance > 0.01

  const handlePaidChange = (checked: boolean) => {
    updateProject(project.id, { isPaid: checked })
    toast.success(checked ? "Proyecto marcado como pagado." : "Se quitó la marca de pagado.")
  }

  const handleAddPayment = (e: React.FormEvent) => {
    e.preventDefault()
    const value = Number.parseFloat(amount)
    if (!Number.isFinite(value) || value <= 0) {
      toast.error("Introduce un monto de abono válido y positivo.")
      return
    }
    addPayment(project.id, value)
    toast.success(`Abono de ${formatCurrency(value)} registrado.`)
    setAmount("")
  }

  const handleStatusChange = (status: ProjectStatus) => {
    updateProject(project.id, { status })
    toast.success(`Estado del proyecto actualizado a: ${status}`)
  }

  const handleDelete = () => {
    deleteProject(project.id)
    toast.success("Proyecto eliminado.")
    navigate(`/clientes/${project.clientId}`)
  }

  const whatsappLink = client
    ? generateWhatsAppLink(client, settings, project, balance)
    : "#"

  return (
    <div className="space-y-6">
      {client && (
        <BackButton
          label={`Volver al Cliente: ${client.name}`}
          onClick={() => navigate(`/clientes/${client.id}`)}
        />
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-start justify-between">
              <div>
                <CardTitle className="text-2xl">{project.name}</CardTitle>
                <CardDescription className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1">
                  <span className="flex items-center gap-1.5">
                    <CalendarDays className="size-3.5" aria-hidden />
                    Creado: {formatDate(project.creationDate)}
                  </span>
                  {project.deliveryDate && (
                    <span className="flex items-center gap-1.5">
                      <CalendarDays className="size-3.5 text-blue-600 dark:text-blue-400" aria-hidden />
                      Entrega: <strong className="text-blue-600 dark:text-blue-400">{formatDate(project.deliveryDate)}</strong>
                    </span>
                  )}
                </CardDescription>
              </div>
              <ProjectStatusBadge status={project.status} className="mt-1" />
            </CardHeader>
            <CardContent className="space-y-4">
              {client && (
                <div className="flex items-center justify-between gap-3 rounded-xl bg-muted/50 p-3">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Cliente</p>
                    <p className="font-semibold text-foreground">{client.name}</p>
                  </div>
                  <div className="flex gap-2">
                    <WhatsAppButton
                      size="sm"
                      label="Mensaje de estado"
                      onClick={() => window.open(whatsappLink, "_blank")}
                    />
                    <Button variant="outline" size="sm" onClick={() => navigate(`/cotizaciones/nueva?cliente=${client.id}`)}>
                      <FileText aria-hidden /> Cotización
                    </Button>
                  </div>
                </div>
              )}

              <div>
                <h3 className="mb-1 text-lg font-semibold text-foreground">Acuerdo y Notas</h3>
                <p className="whitespace-pre-wrap text-muted-foreground">{project.description}</p>
                <Button
                  variant="link"
                  size="sm"
                  className="-ml-3 mt-1 h-auto p-0"
                  onClick={() => setEditOpen(true)}
                >
                  <Pencil className="size-3.5" aria-hidden /> Editar detalles
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Gestión de Pagos</CardTitle>
              <CardDescription>Sigue el avance de los abonos del proyecto.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-3 rounded-xl bg-muted/50 p-4 sm:grid-cols-3">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Precio acordado</p>
                  <p className="mt-1 text-xl font-bold text-foreground">{formatCurrency(project.totalPrice)}</p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Total abonado</p>
                  <p className="mt-1 text-xl font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(totalPaid)}</p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Saldo pendiente</p>
                  <p className={cn("mt-1 text-xl font-bold", hasBalance ? "text-destructive" : "text-foreground")}>
                    {formatCurrency(balance)}
                  </p>
                </div>
              </div>

              <div className="mb-6 flex items-center gap-2">
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-primary/20">
                  <div
                    className={cn("h-full rounded-full transition-all", hasBalance ? "bg-destructive" : "bg-emerald-500")}
                    style={{ width: `${percentPaid}%` }}
                  />
                </div>
                <span className="text-xs font-semibold text-muted-foreground">{percentPaid.toFixed(0)}%</span>
              </div>

              <ToggleRow
                title="Marcado como pagado"
                hint="Se considerará pagado en el Tablero, tarjetas y Dashboard, aunque falte saldo por abonar."
                checked={project.isPaid === true}
                onChange={handlePaidChange}
                ariaLabel="Marcar proyecto como pagado"
                className="mb-6 rounded-xl"
                switchClassName={cn(project.isPaid === true && "bg-emerald-500")}
              />

              <form onSubmit={handleAddPayment} className="flex flex-col gap-2 sm:flex-row">
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Monto del abono ($)"
                  aria-label="Monto del abono"
                  className="flex-1"
                />
                <Button type="submit">
                  <Plus aria-hidden /> Registrar Abono
                </Button>
              </form>

              <div className="pt-2">
                <h4 className="mb-2 font-medium text-foreground">Historial de Pagos</h4>
                {projectPayments.length > 0 ? (
                  <ul className="divide-y divide-border">
                    {projectPayments.map((p) => (
                      <li key={p.id} className="flex items-center justify-between py-2.5 text-sm">
                        <span>
                          Pago de{" "}
                          <strong className="font-bold text-foreground">{formatCurrency(p.amount)}</strong>
                        </span>
                        <span className="flex items-center gap-3">
                          <span className="text-muted-foreground">{formatDate(p.date)}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-7 text-muted-foreground hover:text-destructive"
                            onClick={() => setPaymentToDelete(p.id)}
                            aria-label="Eliminar abono"
                          >
                            <Trash2 className="size-4" aria-hidden />
                          </Button>
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="italic text-muted-foreground">No hay pagos registrados aún.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Actualizar Estado</CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={project.status} onValueChange={(v) => handleStatusChange(v as ProjectStatus)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PROJECT_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Imagen de Avance</CardTitle>
              <CardDescription>Miniatura visible en el dashboard y lista de proyectos.</CardDescription>
            </CardHeader>
            <CardContent>
              <ImagePicker
                value={project.thumbnailBase64}
                onChange={(base64) => {
                  updateProject(project.id, { thumbnailBase64: base64 })
                  toast.success(base64 ? "Miniatura cargada." : "Miniatura eliminada.")
                }}
                label="Miniatura del proyecto"
                aspectClass="aspect-square"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Acciones</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {client && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() =>
                    sourceQuote
                      ? navigate(`/cotizaciones/${sourceQuote.id}`)
                      : navigate(`/cotizaciones/nueva?cliente=${client.id}`)
                  }
                >
                  <FileText aria-hidden /> {sourceQuote ? "Ver cotización de origen" : "Crear cotización"}
                </Button>
              )}
              <Button
                variant="outline"
                className="w-full border-red-200 bg-red-50 text-red-600 hover:bg-red-100 dark:border-red-900 dark:bg-red-950/40 dark:text-red-400 dark:hover:bg-red-950/70"
                onClick={() => setConfirmDelete(true)}
              >
                <Trash2 aria-hidden /> Eliminar Proyecto
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <EditProjectDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        initial={{ name: project.name, price: String(project.totalPrice), description: project.description, deliveryDate: toDateInputValue(project.deliveryDate) }}
        onSave={(data) => {
          updateProject(project.id, {
            name: data.name,
            totalPrice: Number.parseFloat(data.price) || 0,
            description: data.description,
            deliveryDate: data.deliveryDate || null,
          })
          setEditOpen(false)
          toast.success("Proyecto actualizado.")
        }}
      />

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Eliminar Proyecto"
        description={
          <>
            <p>
              ¿Estás segura de eliminar el proyecto <strong>“{project.name}”</strong>?
            </p>
            <p className="font-semibold text-destructive">
              También se eliminarán sus pagos asociados. Esta acción no se puede deshacer.
            </p>
          </>
        }
        confirmLabel="Sí, eliminar"
        destructive
        onConfirm={handleDelete}
      />

      <ConfirmDialog
        open={paymentToDelete !== null}
        onOpenChange={(open) => !open && setPaymentToDelete(null)}
        title="Eliminar abono"
        description="¿Deseas eliminar este registro de pago? El saldo del proyecto se recalculará."
        confirmLabel="Sí, eliminar"
        destructive
        onConfirm={() => {
          if (paymentToDelete) {
            removePayment(paymentToDelete)
            toast.success("Abono eliminado.")
          }
          setPaymentToDelete(null)
        }}
      />
    </div>
  )
}

function EditProjectDialog({
  open,
  onOpenChange,
  initial,
  onSave,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  initial: { name: string; price: string; description: string; deliveryDate: string }
  onSave: (data: { name: string; price: string; description: string; deliveryDate: string }) => void
}) {
  const [name, setName] = useState(initial.name)
  const [price, setPrice] = useState(initial.price)
  const [description, setDescription] = useState(initial.description)
  const [deliveryDate, setDeliveryDate] = useState(initial.deliveryDate)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !price || !description.trim()) return
    onSave({ name: name.trim(), price, description: description.trim(), deliveryDate })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Editar Detalles del Proyecto</DialogTitle>
          <DialogDescription>Modifica la información principal del proyecto.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label="Nombre" htmlFor="edit-name" required>
            <Input id="edit-name" value={name} onChange={(e) => setName(e.target.value)} required />
          </FormField>
          <FormField label="Precio Total (MXN)" htmlFor="edit-price" required>
            <Input id="edit-price" type="number" step="0.01" min="0" value={price} onChange={(e) => setPrice(e.target.value)} required />
          </FormField>
          <FormField label="Descripción / Notas" htmlFor="edit-description" required>
            <Textarea id="edit-description" rows={5} value={description} onChange={(e) => setDescription(e.target.value)} required />
          </FormField>
          <FormField label="Fecha de Entrega" htmlFor="edit-delivery-date">
            <Input id="edit-delivery-date" type="date" value={deliveryDate} onChange={(e) => setDeliveryDate(e.target.value)} />
          </FormField>
          <div className="flex justify-end">
            <Button type="submit">
              <CheckCircle2 aria-hidden /> Guardar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}