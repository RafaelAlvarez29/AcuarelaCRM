import { ArrowLeft, FileText, PackagePlus, Plus, Save, Trash2, UserPlus, Users } from "lucide-react"
import { useMemo, useState } from "react"
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom"
import { toast } from "sonner"

import { FormField } from "@/components/common/form-field"
import { PageHeader } from "@/components/common/page-header"
import { QuickCreateDialog } from "@/components/common/quick-create-dialog"
import { SearchCombobox } from "@/components/common/search-combobox"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { quoteSubtotal, quoteTotals, getProductPrice } from "@/lib/calc"
import type { QuoteDiscountType, QuoteItem } from "@/lib/types"
import { cn, formatCurrency, uid } from "@/lib/utils"
import { useAppStore } from "@/stores/useAppStore"

const VALIDITY_OPTIONS = [7, 15, 30, 60]

function computeValidUntil(days: number): string {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString()
}

export default function QuoteForm() {
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const clients = useAppStore((s) => s.clients)
  const products = useAppStore((s) => s.products)
  const eventTypes = useAppStore((s) => s.eventTypes)
  const existing = useAppStore((s) => (id ? s.quotes.find((q) => q.id === id) : undefined))
  const addQuote = useAppStore((s) => s.addQuote)
  const updateQuote = useAppStore((s) => s.updateQuote)
  const addClient = useAppStore((s) => s.addClient)
  const addProduct = useAppStore((s) => s.addProduct)

  const isEdit = Boolean(id)

  const activeEventTypes = eventTypes.filter((e) => e.isActive)

  const [clientId, setClientId] = useState<string | null>(() => {
    if (id && existing?.clientId) return existing.clientId
    const preselected = searchParams.get("cliente")
    return preselected && clients.some((c) => c.id === preselected) ? preselected : null
  })
  const [eventTypeId, setEventTypeId] = useState<string | null>(() => {
    if (id && existing?.eventTypeId) return existing.eventTypeId
    return null
  })
  const [items, setItems] = useState<QuoteItem[]>(() => (existing?.items ?? []).map((i) => ({ ...i })))
  const [discountType, setDiscountType] = useState<QuoteDiscountType>(existing?.discountType ?? "percent")
  const [discountValue, setDiscountValue] = useState<string>(existing ? String(existing.discountValue) : "0")
  const [taxRate, setTaxRate] = useState<string>(existing ? String(existing.taxRate) : "0")
  const [deposit, setDeposit] = useState<string>(existing ? String(existing.deposit ?? 0) : "0")
  const [validityDays, setValidityDays] = useState<number>(30)
  const [notes, setNotes] = useState(existing?.notes ?? "")
  const [productQuery, setProductQuery] = useState("")
  const [clientQuery, setClientQuery] = useState("")
  const [clientDialogOpen, setClientDialogOpen] = useState(false)
  const [newClientName, setNewClientName] = useState("")
  const [newClientPhone, setNewClientPhone] = useState("")
  const [productDialogOpen, setProductDialogOpen] = useState(false)
  const [newProductName, setNewProductName] = useState("")
  const [newProductPrice, setNewProductPrice] = useState("")

  const activeProducts = products.filter((p) => p.isActive)
  const selectedClient = clients.find((c) => c.id === clientId) ?? null
  const selectedEventType = activeEventTypes.find((e) => e.id === eventTypeId) ?? null

  const clientMatches = useMemo(() => {
    const q = clientQuery.trim().toLowerCase()
    return clients
      .filter((c) => !q || c.name.toLowerCase().includes(q))
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [clients, clientQuery])

  const productMatches = useMemo(() => {
    const q = productQuery.trim().toLowerCase()
    return activeProducts.filter(
      (p) =>
        !q ||
        p.name.toLowerCase().includes(q) ||
        (p.category?.toLowerCase().includes(q) ?? false),
    )
  }, [activeProducts, productQuery])

  const totals = useMemo(
    () => quoteTotals({ items, discountType, discountValue: Number(discountValue) || 0, taxRate: Number(taxRate) || 0 }),
    [items, discountType, discountValue, taxRate],
  )
  const depositAmount = Math.max(0, Number(deposit) || 0)

  const addItemFromProduct = (productId: string) => {
    const product = products.find((p) => p.id === productId)
    if (!product) return
    const unitPrice = getProductPrice(product, eventTypeId)
    setItems((prev) => {
      const existing = prev.find((i) => i.productId === productId)
      if (existing) {
        return prev.map((i) =>
          i.id === existing.id
            ? { ...i, quantity: i.quantity + 1, unitPrice }
            : i,
        )
      }
      return [
        ...prev,
        {
          id: uid(),
          productId: product.id,
          name: product.name,
          description: product.description,
          quantity: 1,
          unitPrice,
        },
      ]
    })
  }

  const addManualItem = () => {
    setItems((prev) => [
      ...prev,
      { id: uid(), productId: null, name: "", description: null, quantity: 1, unitPrice: 0 },
    ])
  }

  const handleEventTypeChange = (value: string) => {
    const nextId = value === "none" ? null : value
    setEventTypeId(nextId)
    setItems((prev) =>
      prev.map((item) => {
        if (!item.productId) return item
        const product = products.find((p) => p.id === item.productId)
        if (!product) return item
        return { ...item, unitPrice: getProductPrice(product, nextId) }
      }),
    )
  }

  const updateItem = (itemId: string, patch: Partial<QuoteItem>) => {
    setItems((prev) => prev.map((i) => (i.id === itemId ? { ...i, ...patch } : i)))
  }

  const removeItem = (itemId: string) => setItems((prev) => prev.filter((i) => i.id !== itemId))

  const handlePickProduct = (productId: string) => {
    addItemFromProduct(productId)
    setProductQuery("")
  }

  const handleCreateClient = () => {
    if (!newClientName.trim()) {
      toast.error("Escribe el nombre del cliente.")
      return
    }
    const newId = addClient({ name: newClientName, whatsapp_number: newClientPhone })
    setClientId(newId)
    setClientDialogOpen(false)
    setNewClientName("")
    setNewClientPhone("")
    toast.success("Cliente creado.")
  }

  const handleCreateProduct = () => {
    if (!newProductName.trim()) {
      toast.error("Escribe el nombre del producto.")
      return
    }
    const priceValue = Number.parseFloat(newProductPrice)
    if (!Number.isFinite(priceValue) || priceValue < 0) {
      toast.error("Escribe un precio válido.")
      return
    }
    const newId = addProduct({
      name: newProductName.trim(),
      price: priceValue,
      priceByEventType: {},
      category: null,
      description: null,
      imageBase64: null,
      isActive: true,
    })
    addItemFromProduct(newId)
    setProductDialogOpen(false)
    setNewProductName("")
    setNewProductPrice("")
    toast.success("Producto creado y agregado a la cotización.")
  }

  const handleSave = () => {
    if (!selectedClient) {
      toast.error("Selecciona un cliente para la cotización.")
      return
    }
    const validItems = items.filter(
      (i) => i.name.trim() && Number.isFinite(i.unitPrice) && i.unitPrice > 0 && i.quantity > 0,
    )
    if (validItems.length === 0) {
      toast.error("Agrega al menos un producto o servicio con precio válido.")
      return
    }

    const validUntil = computeValidUntil(validityDays)
    const payload = {
      clientId: selectedClient.id,
      clientName: selectedClient.name,
      clientPhone: selectedClient.whatsapp_number,
      clientEmail: selectedClient.email,
      eventTypeId: selectedEventType?.id ?? null,
      eventTypeName: selectedEventType?.name ?? null,
      items: validItems,
      discountType,
      discountValue: Math.max(0, Number(discountValue) || 0),
      taxRate: Math.max(0, Number(taxRate) || 0),
      deposit: Math.max(0, Number(deposit) || 0),
      notes: notes.trim() || null,
      status: existing?.status ?? ("Borrador" as const),
      validUntil,
    }

    if (isEdit && existing) {
      updateQuote(existing.id, payload)
      toast.success("Cotización actualizada.")
      navigate(`/cotizaciones/${existing.id}`)
      return
    }

    const newId = addQuote(payload)
    toast.success("Cotización creada.")
    navigate(`/cotizaciones/${newId}`)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={isEdit ? "Editar Cotización" : "Nueva Cotización"}
        description={isEdit && existing ? `Código ${existing.code}` : "Arma una cotización para un cliente."}
      >
        <Button variant="outline" onClick={() => navigate(-1)}>
          <ArrowLeft aria-hidden /> Volver
        </Button>
        <Button onClick={handleSave}>
          <Save aria-hidden /> {isEdit ? "Guardar cambios" : "Crear cotización"}
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="size-5 text-primary" aria-hidden /> Cliente
              </CardTitle>
              <CardDescription>La cotización guardará una copia de los datos del cliente.</CardDescription>
            </CardHeader>
            <CardContent>
              <SearchCombobox
                query={clientQuery}
                onQueryChange={setClientQuery}
                items={clientMatches}
                getKey={(c) => c.id}
                renderItem={(c) => (
                  <>
                    <span className="truncate font-medium text-foreground">{c.name}</span>
                    {c.whatsapp_number && (
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {c.whatsapp_number}
                      </span>
                    )}
                  </>
                )}
                onSelect={(c) => {
                  setClientId(c.id)
                  setClientQuery("")
                }}
                createLabel="Crear nuevo cliente"
                createIcon={<UserPlus className="size-4" aria-hidden />}
                onCreate={() => setClientDialogOpen(true)}
                noData={clients.length === 0}
                emptyText="Aún no hay clientes registrados."
                placeholder="Buscar cliente…"
                ariaLabel="Buscar cliente"
              />
              {selectedClient && (
                <div className="mt-3 rounded-lg border border-primary/20 bg-primary/5 p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary/15 text-lg font-bold text-primary">
                      {selectedClient.name.charAt(0).toUpperCase()}
                    </div>
                    <p className="text-lg font-bold text-foreground">{selectedClient.name}</p>
                  </div>
                  <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Teléfono
                      </p>
                      <p className="text-base font-semibold text-foreground">
                        {selectedClient.whatsapp_number || "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Correo
                      </p>
                      <p className="text-base font-semibold text-foreground">
                        {selectedClient.email || "—"}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PackagePlus className="size-5 text-primary" aria-hidden /> Productos y Servicios
              </CardTitle>
              <CardDescription>Agrega artículos del catálogo o ingresalos manualmente.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative flex gap-2">
                <SearchCombobox
                  className="flex-1"
                  query={productQuery}
                  onQueryChange={setProductQuery}
                  items={productMatches}
                  getKey={(p) => p.id}
                  renderItem={(p) => (
                    <>
                      <span className="min-w-0">
                        <span className="block truncate font-medium text-foreground">
                          {p.name}
                        </span>
                        {p.category && (
                          <span className="block text-xs text-muted-foreground">
                            {p.category}
                          </span>
                        )}
                      </span>
                      <span className="shrink-0 text-xs font-semibold text-primary">
                        {formatCurrency(getProductPrice(p, eventTypeId))}
                      </span>
                    </>
                  )}
                  onSelect={(p) => handlePickProduct(p.id)}
                  createLabel="Crear nuevo producto"
                  createIcon={<PackagePlus className="size-4" aria-hidden />}
                  onCreate={() => setProductDialogOpen(true)}
                  noData={activeProducts.length === 0}
                  emptyText="No hay productos disponibles en el catálogo."
                  placeholder="Buscar en el catálogo…"
                  ariaLabel="Buscar productos del catálogo"
                />
                <Button variant="outline" onClick={addManualItem}>
                  <Plus aria-hidden /> Manual
                </Button>
              </div>

              {items.length > 0 ? (
                <ul className="space-y-3">
                  {items.map((item) => (
                    <li key={item.id} className="flex flex-col gap-2 rounded-lg border p-3 sm:flex-row sm:items-center">
                      <Input
                        value={item.name}
                        onChange={(e) => updateItem(item.id, { name: e.target.value })}
                        placeholder="Concepto"
                        className="flex-1"
                      />
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          min="1"
                          step="1"
                          value={item.quantity}
                          onChange={(e) => updateItem(item.id, { quantity: Math.max(1, Number(e.target.value) || 1) })}
                          className="w-20"
                          aria-label="Cantidad"
                        />
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.unitPrice}
                          onChange={(e) => updateItem(item.id, { unitPrice: Math.max(0, Number(e.target.value) || 0) })}
                          className="w-32"
                          aria-label="Precio unitario"
                        />
                        <span className="w-24 text-right text-sm font-semibold text-foreground">
                          {formatCurrency(item.quantity * item.unitPrice)}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8 text-muted-foreground hover:text-destructive"
                          onClick={() => removeItem(item.id)}
                          aria-label="Quitar concepto"
                        >
                          <Trash2 className="size-4" aria-hidden />
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                  Sin conceptos. Agrega productos del catálogo o crea uno manual.
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Notas</CardTitle>
              <CardDescription>Condiciones, tiempos de entrega o información adicional.</CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ej. Incluye 2 revisiones, los archivos se entregan en alta resolución…"
              />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="size-5 text-primary" aria-hidden /> Parámetros
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Tipo de evento</Label>
                <Select
                  value={eventTypeId ?? "none"}
                  onValueChange={handleEventTypeChange}
                  disabled={activeEventTypes.length === 0}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Precio base</SelectItem>
                    {activeEventTypes.map((et) => (
                      <SelectItem key={et.id} value={et.id}>
                        {et.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {activeEventTypes.length > 0 ? (
                  <>
                    <p className="text-xs text-muted-foreground">
                      Los productos del catálogo mostrarán su precio según el tipo de evento.
                    </p>
                    {selectedEventType?.series && (
                      <p className="text-xs font-medium text-primary">
                        Serie {selectedEventType.series}: la cotización se codificará con el prefijo{" "}
                        {selectedEventType.series}.
                      </p>
                    )}
                  </>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Aún no hay tipos de evento.{" "}
                    <Link to="/tipos-evento" className="font-medium text-primary underline-offset-2 hover:underline">
                      Créalos aquí
                    </Link>{" "}
                    para asignar precios especiales por evento.
                  </p>
                )}
              </div>
              <FormField label="Descuento">
                <div className="flex gap-2">
                  <Select value={discountType} onValueChange={(v) => setDiscountType(v as QuoteDiscountType)}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percent">%</SelectItem>
                      <SelectItem value="fixed">$</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    type="number"
                    min="0"
                    step={discountType === "percent" ? "1" : "0.01"}
                    value={discountValue}
                    onChange={(e) => setDiscountValue(e.target.value)}
                    placeholder="0"
                  />
                </div>
              </FormField>
              <FormField label="Impuesto (%)" htmlFor="tax-rate">
                <Input
                  id="tax-rate"
                  type="number"
                  min="0"
                  step="0.1"
                  value={taxRate}
                  onChange={(e) => setTaxRate(e.target.value)}
                  placeholder="0"
                />
              </FormField>
              <FormField label="Vigencia" htmlFor="validity">
                <Select value={String(validityDays)} onValueChange={(v) => setValidityDays(Number(v))}>
                  <SelectTrigger id="validity" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {VALIDITY_OPTIONS.map((d) => (
                      <SelectItem key={d} value={String(d)}>
                        {d} días
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>
              <FormField
                label="Anticipo (MXN)"
                htmlFor="deposit"
                hint="Monto que el cliente ya ha entregado. Se mostrará en la cotización impresa."
              >
                <Input
                  id="deposit"
                  type="number"
                  min="0"
                  step="0.01"
                  value={deposit}
                  onChange={(e) => setDeposit(e.target.value)}
                  placeholder="0.00"
                />
              </FormField>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Totales</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium text-foreground">{formatCurrency(quoteSubtotal(items))}</span>
              </div>
              {totals.discount > 0.004 && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Descuento</span>
                  <span className="font-medium text-destructive">-{formatCurrency(totals.discount)}</span>
                </div>
              )}
              {totals.tax > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Impuesto ({taxRate}%)</span>
                  <span className="font-medium text-foreground">{formatCurrency(totals.tax)}</span>
                </div>
              )}
              <div className={cn("mt-2 flex items-center justify-between border-t pt-2")}>
                <span className="font-semibold text-foreground">Total</span>
                <span className="text-lg font-bold text-primary">{formatCurrency(totals.total)}</span>
              </div>
              {depositAmount > 0 && (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Anticipo</span>
                    <span className="font-medium text-emerald-600 dark:text-emerald-400">
                      -{formatCurrency(depositAmount)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Saldo por pagar</span>
                    <span className="font-semibold text-foreground">
                      {formatCurrency(totals.total - depositAmount)}
                    </span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Button className="w-full" size="lg" onClick={handleSave}>
            <Save aria-hidden /> {isEdit ? "Guardar cambios" : "Crear cotización"}
          </Button>
        </div>
      </div>

      <QuickCreateDialog
        open={clientDialogOpen}
        onOpenChange={setClientDialogOpen}
        icon={<UserPlus className="size-5 text-primary" aria-hidden />}
        title="Nuevo Cliente"
        description="Se creará en tu carpeta de clientes y se seleccionará en esta cotización."
        fields={[
          {
            id: "quote-new-client-name",
            label: "Nombre",
            placeholder: "Nombre del cliente",
            required: true,
            value: newClientName,
            onChange: setNewClientName,
          },
          {
            id: "quote-new-client-phone",
            label: "WhatsApp",
            placeholder: "Ej. 668 000 0000",
            value: newClientPhone,
            onChange: setNewClientPhone,
          },
        ]}
        submitLabel="Crear y seleccionar"
        onSubmit={handleCreateClient}
      />

      <QuickCreateDialog
        open={productDialogOpen}
        onOpenChange={setProductDialogOpen}
        icon={<PackagePlus className="size-5 text-primary" aria-hidden />}
        title="Nuevo Producto"
        description="Se agregará al catálogo y se anexará a esta cotización automáticamente."
        fields={[
          {
            id: "quote-new-product-name",
            label: "Nombre",
            placeholder: "Ej. Invitación premium",
            required: true,
            value: newProductName,
            onChange: setNewProductName,
          },
          {
            id: "quote-new-product-price",
            label: "Precio base (MXN)",
            type: "number",
            placeholder: "0.00",
            required: true,
            value: newProductPrice,
            onChange: setNewProductPrice,
          },
        ]}
        submitLabel="Crear y agregar"
        onSubmit={handleCreateProduct}
      />
    </div>
  )
}