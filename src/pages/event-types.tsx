import { CalendarHeart, Pencil, Plus, Trash2 } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

import { ConfirmDialog } from "@/components/common/confirm-dialog"
import { EmptyState } from "@/components/common/empty-state"
import { FormField } from "@/components/common/form-field"
import { PageHeader } from "@/components/common/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { useAppStore } from "@/stores/useAppStore"
import type { EventType } from "@/lib/types"

export default function EventTypes() {
  const eventTypes = useAppStore((s) => s.eventTypes)
  const addEventType = useAppStore((s) => s.addEventType)
  const updateEventType = useAppStore((s) => s.updateEventType)
  const toggleEventType = useAppStore((s) => s.toggleEventType)
  const deleteEventType = useAppStore((s) => s.deleteEventType)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<EventType | null>(null)
  const [name, setName] = useState("")
  const [series, setSeries] = useState("")
  const [toDelete, setToDelete] = useState<EventType | null>(null)

  const openNew = () => {
    setEditing(null)
    setName("")
    setSeries("")
    setDialogOpen(true)
  }

  const openEdit = (eventType: EventType) => {
    setEditing(eventType)
    setName(eventType.name)
    setSeries(eventType.series ?? "")
    setDialogOpen(true)
  }

  const handleSave = () => {
    const trimmed = name.trim()
    if (!trimmed) {
      toast.error("Escribe el nombre del tipo de evento.")
      return
    }
    const trimmedSeries = series.trim().toUpperCase()
    if (!trimmedSeries) {
      toast.error("Escribe la serie del tipo de evento (se usará en los códigos de cotización).")
      return
    }
    const duplicate = eventTypes.some(
      (e) => e.name.trim().toLowerCase() === trimmed.toLowerCase() && e.id !== editing?.id,
    )
    if (duplicate) {
      toast.error("Ya existe un tipo de evento con ese nombre.")
      return
    }
    const seriesTaken = eventTypes.some(
      (e) => (e.series ?? "").toUpperCase() === trimmedSeries && e.id !== editing?.id,
    )
    if (seriesTaken) {
      toast.error("Ya existe un tipo de evento con esa serie.")
      return
    }
    if (editing) {
      updateEventType(editing.id, { name: trimmed, series: trimmedSeries })
      toast.success("Tipo de evento actualizado.")
    } else {
      addEventType({ name: trimmed, series: trimmedSeries })
      toast.success("Tipo de evento agregado.")
    }
    setDialogOpen(false)
    setEditing(null)
    setName("")
    setSeries("")
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tipos de Evento"
        description="Catálogo de tipos de evento que se usan para cotizar precios."
      >
        <Button onClick={openNew}>
          <Plus aria-hidden /> Nuevo Tipo de Evento
        </Button>
      </PageHeader>

      {eventTypes.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...eventTypes]
            .sort((a, b) => a.name.localeCompare(b.name))
            .map((eventType) => (
              <Card key={eventType.id} className="flex flex-col">
                <CardContent className="flex flex-1 items-center justify-between gap-3 p-4">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-foreground">{eventType.name}</p>
                    {eventType.series && (
                      <p className="mt-0.5 text-xs font-medium text-primary">
                        Serie: {eventType.series}
                      </p>
                    )}
                    <div className="mt-1">
                      <span
                        className={
                          eventType.isActive
                            ? "inline-flex w-fit items-center rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-600"
                            : "inline-flex w-fit items-center rounded-md border px-2 py-0.5 text-xs font-medium text-muted-foreground"
                        }
                      >
                        {eventType.isActive ? "Activo" : "No activo"}
                      </span>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 text-muted-foreground hover:text-foreground"
                      onClick={() => openEdit(eventType)}
                      aria-label="Editar tipo de evento"
                    >
                      <Pencil className="size-4" aria-hidden />
                    </Button>
                    {eventType.isActive && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 text-muted-foreground hover:text-destructive"
                        onClick={() => setToDelete(eventType)}
                        aria-label="Eliminar tipo de evento"
                      >
                        <Trash2 className="size-4" aria-hidden />
                      </Button>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="flex items-center justify-between border-t p-3">
                  <span className="text-xs text-muted-foreground">Disponible para cotizar</span>
                  <Switch
                    checked={eventType.isActive}
                    onCheckedChange={() => {
                      toggleEventType(eventType.id)
                      toast.success(eventType.isActive ? "Tipo de evento desactivado." : "Tipo de evento activado.")
                    }}
                  />
                </CardFooter>
              </Card>
            ))}
        </div>
      ) : (
        <EmptyState
          icon={CalendarHeart}
          title="Sin tipos de evento"
          description="Registra tipos de evento para configurar precios especiales en tus productos."
          action={{ label: "Agregar primer tipo de evento", onClick: openNew }}
        />
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editing ? "Editar tipo de evento" : "Nuevo tipo de evento"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
          <FormField label="Nombre" htmlFor="event-type-name">
            <Input
              id="event-type-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="p. ej. Boda, XV años, Cumpleaños…"
              autoFocus
              onKeyDown={(e) => e.key === "Enter" && handleSave()}
            />
          </FormField>
          <FormField
            label="Serie"
            htmlFor="event-type-series"
            required
            hint="Se usa como prefijo de los códigos de cotización de este tipo de evento."
          >
            <Input
              id="event-type-series"
              value={series}
              onChange={(e) => setSeries(e.target.value.toUpperCase())}
              placeholder="p. ej. BODA, XV, CUM…"
              onKeyDown={(e) => e.key === "Enter" && handleSave()}
            />
          </FormField>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>{editing ? "Guardar cambios" : "Agregar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={toDelete !== null}
        onOpenChange={(open) => !open && setToDelete(null)}
        title="Eliminar tipo de evento"
        description={
          <>
            ¿Deseas eliminar “{toDelete?.name ?? ""}”? También se quitarán los precios configurados
            para este tipo de evento en los productos.
          </>
        }
        confirmLabel="Sí, eliminar"
        destructive
        onConfirm={() => {
          if (toDelete) {
            deleteEventType(toDelete.id)
            toast.success("Tipo de evento eliminado.")
          }
          setToDelete(null)
        }}
      />
    </div>
  )
}