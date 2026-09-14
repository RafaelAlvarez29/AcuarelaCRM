import { FolderPlus, UserPlus } from "lucide-react"
import { useMemo, useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { toast } from "sonner"

import { BackButton } from "@/components/common/back-button"
import { EmptyState } from "@/components/common/empty-state"
import { FormField } from "@/components/common/form-field"
import { PageHeader } from "@/components/common/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { PROJECT_STATUSES } from "@/lib/types"
import { useAppStore } from "@/stores/useAppStore"
import type { ProjectStatus } from "@/lib/types"

export default function ProjectForm() {
  const clients = useAppStore((s) => s.clients)
  const addProject = useAppStore((s) => s.addProject)
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const preselectedClientId = searchParams.get("cliente") ?? undefined
  const clientId = useMemo(
    () =>
      preselectedClientId && clients.some((c) => c.id === preselectedClientId)
        ? preselectedClientId
        : undefined,
    [preselectedClientId, clients],
  )

  const [name, setName] = useState("")
  const [price, setPrice] = useState("")
  const [description, setDescription] = useState("")
  const [deliveryDate, setDeliveryDate] = useState("")
  const [status, setStatus] = useState<ProjectStatus>(PROJECT_STATUSES[0])
  const [selectedClientId, setSelectedClientId] = useState<string>(clientId ?? "")

  if (clients.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader title="Nuevo Proyecto" description="Define los detalles del nuevo trabajo." />
        <EmptyState
          icon={UserPlus}
          title="Primero necesitas un cliente"
          description="No hay clientes registrados. Crea uno antes de asignarle un proyecto."
          action={{
            label: "Crear primer cliente",
            icon: UserPlus,
            onClick: () => navigate("/clientes/nuevo?continuar=proyecto"),
          }}
        />
      </div>
    )
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedClientId || !name.trim() || !price || !description.trim()) return

    const id = addProject({
      clientId: selectedClientId,
      name: name.trim(),
      totalPrice: Number.parseFloat(price) || 0,
      description: description.trim(),
      status,
      deliveryDate: deliveryDate || null,
      thumbnailBase64: null,
    })
    toast.success(`Proyecto "${name.trim()}" creado.`)
    navigate(`/proyectos/${id}`)
  }

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <BackButton onClick={() => navigate(-1)} />

      <PageHeader title="Nuevo Proyecto" description="Define los detalles del nuevo trabajo." />

      <Card>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <FormField
              label="Asignar Cliente"
              htmlFor="project-client-id"
              required
              hint="¿Cliente nuevo? Crea uno desde la sección Clientes."
            >
              <Select value={selectedClientId} onValueChange={setSelectedClientId} required>
                <SelectTrigger id="project-client-id" className="w-full">
                  <SelectValue placeholder="Selecciona un cliente" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>

            <FormField label="Nombre del Proyecto" htmlFor="project-name" required>
              <Input
                id="project-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej. Invitación temática / Edición de fotos"
                required
              />
            </FormField>

            <FormField label="Precio Total (MXN)" htmlFor="project-price" required>
              <Input
                id="project-price"
                type="number"
                step="0.01"
                min="0"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0.00"
                required
              />
            </FormField>

            <FormField label="Descripción del Acuerdo" htmlFor="project-description" required>
              <Textarea
                id="project-description"
                rows={5}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe qué incluye el proyecto, acuerdos, entregables…"
                required
              />
            </FormField>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField label="Fecha de Entrega" htmlFor="project-delivery-date">
                <Input
                  id="project-delivery-date"
                  type="date"
                  value={deliveryDate}
                  onChange={(e) => setDeliveryDate(e.target.value)}
                />
              </FormField>
              <FormField label="Estado" htmlFor="project-status">
                <Select
                  value={status}
                  onValueChange={(v) => setStatus(v as ProjectStatus)}
                >
                  <SelectTrigger id="project-status" className="w-full">
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
              </FormField>
            </div>

            <Button type="submit" className="w-full">
              <FolderPlus aria-hidden /> Crear Proyecto
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}