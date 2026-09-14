import { CalendarHeart, Save } from "lucide-react"
import { useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { toast } from "sonner"

import { BackButton } from "@/components/common/back-button"
import { FormField } from "@/components/common/form-field"
import { ImagePicker } from "@/components/common/image-picker"
import { PageHeader } from "@/components/common/page-header"
import { ToggleRow } from "@/components/common/toggle-row"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useAppStore } from "@/stores/useAppStore"

export default function ProductForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const products = useAppStore((s) => s.products)
  const addProduct = useAppStore((s) => s.addProduct)
  const updateProduct = useAppStore((s) => s.updateProduct)
  const eventTypes = useAppStore((s) => s.eventTypes)
  const activeEventTypes = eventTypes.filter((e) => e.isActive)

  const product = id ? products.find((p) => p.id === id) : undefined
  const isEdit = Boolean(product)

  const [name, setName] = useState(product?.name ?? "")
  const [price, setPrice] = useState(product ? String(product.price) : "")
  const [eventPrices, setEventPrices] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {}
    for (const et of eventTypes) {
      const value = product?.priceByEventType?.[et.id]
      if (value != null) initial[et.id] = String(value)
    }
    return initial
  })
  const [category, setCategory] = useState(product?.category ?? "")
  const [description, setDescription] = useState(product?.description ?? "")
  const [image, setImage] = useState<string | null>(product?.imageBase64 ?? null)
  const [isActive, setIsActive] = useState(product?.isActive ?? true)
  const [busy, setBusy] = useState(false)

  const buildEventPrices = (): Record<string, number> => {
    const result: Record<string, number> = {}
    for (const et of activeEventTypes) {
      const raw = eventPrices[et.id]
      if (raw == null || raw.trim() === "") continue
      const parsed = Number.parseFloat(raw)
      if (Number.isFinite(parsed) && parsed >= 0) result[et.id] = parsed
    }
    return result
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    const priceValue = Number.parseFloat(price)
    if (!Number.isFinite(priceValue) || priceValue < 0) return
    setBusy(true)

    const payload = {
      name: name.trim(),
      price: priceValue,
      priceByEventType: buildEventPrices(),
      category: category.trim() || null,
      description: description.trim() || null,
      imageBase64: image,
      isActive,
    }

    if (isEdit && product) {
      updateProduct(product.id, payload)
      toast.success("Producto actualizado.")
    } else {
      addProduct(payload)
      toast.success("Producto agregado al catálogo.")
    }
    setBusy(false)
    navigate("/productos")
  }

  if (id && !product) {
    return (
      <div className="mx-auto max-w-xl space-y-6">
        <BackButton label="Volver al Catálogo" onClick={() => navigate("/productos")} />
        <PageHeader title="Producto no encontrado" description="El producto que buscas no existe." />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <BackButton label="Volver al Catálogo" onClick={() => navigate("/productos")} />

      <PageHeader
        title={isEdit ? "Editar Producto" : "Crear Nuevo Producto"}
        description="Agrega un producto o servicio del catálogo para usarlo en tus cotizaciones."
      />

      <Card>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <FormField label="Nombre" htmlFor="product-name" required>
              <Input
                id="product-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej. Invitación premium, Edición de video…"
                required
                autoFocus
              />
            </FormField>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField label="Precio base (MXN)" htmlFor="product-price" required>
                <Input
                  id="product-price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="0.00"
                  required
                />
              </FormField>
              <FormField label="Categoría" htmlFor="product-category">
                <Input
                  id="product-category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="Ej. Invitaciones, Diseño…"
                />
              </FormField>
            </div>

            <div className="space-y-3 rounded-lg border bg-muted/30 p-4">
              <div className="flex items-center gap-2">
                <CalendarHeart className="size-4 text-primary" aria-hidden />
                <p className="text-sm font-semibold">Precio por tipo de evento</p>
              </div>
              {activeEventTypes.length > 0 ? (
                <>
                  <p className="text-xs text-muted-foreground">
                    Deja vacío un precio para usar el precio base en ese tipo de evento.
                  </p>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {activeEventTypes.map((et) => (
                      <div key={et.id} className="space-y-1.5">
                        <Label htmlFor={`event-price-${et.id}`} className="text-xs">
                          {et.name}
                        </Label>
                        <Input
                          id={`event-price-${et.id}`}
                          type="number"
                          step="0.01"
                          min="0"
                          value={eventPrices[et.id] ?? ""}
                          onChange={(e) =>
                            setEventPrices((prev) => ({ ...prev, [et.id]: e.target.value }))
                          }
                          placeholder="0.00"
                        />
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <p className="text-xs text-muted-foreground">
                  No hay tipos de evento activos.{" "}
                  <button
                    type="button"
                    className="font-medium text-primary underline underline-offset-2"
                    onClick={() => navigate("/tipos-evento")}
                  >
                    Regístralos en Tipos de Evento
                  </button>{" "}
                  para solicitar un precio por cada tipo.
                </p>
              )}
            </div>

            <FormField label="Descripción" htmlFor="product-description">
              <Textarea
                id="product-description"
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Detalles del producto o servicio…"
              />
            </FormField>

            <FormField label="Imagen">
              <ImagePicker value={image} onChange={setImage} label="Imagen del producto" />
            </FormField>

            <ToggleRow
              title="Disponible"
              hint="Solo los productos disponibles aparecen en las cotizaciones."
              checked={isActive}
              onChange={setIsActive}
            />

            <Button type="submit" className="w-full" disabled={busy}>
              <Save aria-hidden />
              {isEdit ? "Guardar cambios" : "Agregar producto"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}