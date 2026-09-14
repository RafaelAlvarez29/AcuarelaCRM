import { Package, Pencil, Plus, Search, Trash2 } from "lucide-react"
import { useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"

import { ConfirmDialog } from "@/components/common/confirm-dialog"
import { EmptyState } from "@/components/common/empty-state"
import { LoadMoreButton } from "@/components/common/load-more-button"
import { PageHeader } from "@/components/common/page-header"
import { SearchInput } from "@/components/common/search-input"
import { useLoadMore } from "@/hooks/useLoadMore"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { formatCurrency } from "@/lib/utils"
import { getInitial } from "@/lib/utils"
import { getPaletteColor } from "@/lib/constants"
import { useAppStore } from "@/stores/useAppStore"
import type { Product } from "@/lib/types"

export default function ProductList() {
  const navigate = useNavigate()
  const products = useAppStore((s) => s.products)
  const updateProduct = useAppStore((s) => s.updateProduct)
  const deleteProduct = useAppStore((s) => s.deleteProduct)

  const [search, setSearch] = useState("")
  const [category, setCategory] = useState("all")
  const [toDelete, setToDelete] = useState<Product | null>(null)

  const categories = useMemo(
    () => Array.from(new Set(products.map((p) => p.category).filter(Boolean) as string[])).sort(),
    [products],
  )

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return products.filter((p) => {
      const matchesSearch =
        !q || p.name.toLowerCase().includes(q) || p.category?.toLowerCase().includes(q)
      const matchesCategory = category === "all" || p.category === category
      return matchesSearch && matchesCategory
    })
  }, [products, search, category])

  const { visible, hasMore, loadMore } = useLoadMore(filtered, 12, search, category)

  return (
    <div className="space-y-6">
      <PageHeader title="Catálogo de Productos" description="Administra tus productos y servicios.">
        <Button onClick={() => navigate("/productos/nuevo")}>
          <Plus aria-hidden /> Nuevo Producto
        </Button>
      </PageHeader>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Buscar productos o servicios…"
        />
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-full sm:w-56">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las categorías</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filtered.length > 0 ? (
        <>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {visible.map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                onEdit={() => navigate(`/productos/${p.id}/editar`)}
                onDelete={() => setToDelete(p)}
                onToggle={() => {
                  updateProduct(p.id, { isActive: !p.isActive })
                  toast.success(p.isActive ? "Producto desactivado." : "Producto activado.")
                }}
              />
            ))}
          </div>
          {hasMore && (
            <LoadMoreButton onClick={loadMore} remaining={filtered.length - visible.length} />
          )}
        </>
      ) : products.length === 0 ? (
        <EmptyState
          icon={Package}
          title="Tu catálogo está vacío"
          description="Agrega productos y servicios para usarlos en tus cotizaciones."
          action={{
            label: "Agregar primer producto",
            onClick: () => navigate("/productos/nuevo"),
          }}
        />
      ) : (
        <EmptyState
          icon={Search}
          title="Sin resultados"
          description="Ningún producto coincide con tu búsqueda o filtro."
        />
      )}

      <ConfirmDialog
        open={toDelete !== null}
        onOpenChange={(open) => !open && setToDelete(null)}
        title="Eliminar producto"
        description={`¿Deseas eliminar “${toDelete?.name ?? ""}” del catálogo?`}
        confirmLabel="Sí, eliminar"
        destructive
        onConfirm={() => {
          if (toDelete) {
            deleteProduct(toDelete.id)
            toast.success("Producto eliminado.")
          }
          setToDelete(null)
        }}
      />
    </div>
  )
}

function ProductCard({
  product,
  onEdit,
  onDelete,
  onToggle,
}: {
  product: Product
  onEdit: () => void
  onDelete: () => void
  onToggle: () => void
}) {
  const hasEventPrices = product.priceByEventType && Object.keys(product.priceByEventType).length > 0
  const placeholderColor = getPaletteColor()

  return (
    <Card className="overflow-hidden">
      <div className="relative">
        {product.imageBase64 ? (
          <img
            src={product.imageBase64}
            alt={product.name}
            className="h-40 w-full object-cover"
          />
        ) : (
          <div
            className="flex h-40 items-center justify-center"
            style={{
              backgroundImage: `linear-gradient(135deg, ${placeholderColor}33 0%, ${placeholderColor}33 50%, ${placeholderColor}0D 100%)`,
            }}
          >
            <span className="text-5xl font-bold" style={{ color: placeholderColor }}>
              {getInitial(product.name)}
            </span>
          </div>
        )}
        {!product.isActive && (
          <span className="absolute left-2 top-2 rounded-full bg-background/90 px-2 py-0.5 text-[11px] font-medium text-muted-foreground shadow">
            No disponible
          </span>
        )}
      </div>
      <CardContent className="space-y-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate font-semibold text-foreground">{product.name}</p>
            <div className="mt-1 flex items-baseline gap-1.5">
              <p className="text-lg font-bold text-primary">{formatCurrency(product.price)}</p>
              <span className="text-xs text-muted-foreground">base</span>
            </div>
            {hasEventPrices && (
              <p className="text-xs text-muted-foreground">Precios por tipo de evento</p>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <Button variant="ghost" size="icon" className="size-8 text-muted-foreground hover:text-foreground" onClick={onEdit} aria-label="Editar producto">
              <Pencil className="size-4" aria-hidden />
            </Button>
            <Button variant="ghost" size="icon" className="size-8 text-muted-foreground hover:text-destructive" onClick={onDelete} aria-label="Eliminar producto">
              <Trash2 className="size-4" aria-hidden />
            </Button>
          </div>
        </div>
        {product.category && <Badge variant="secondary">{product.category}</Badge>}
        {product.description && (
          <p className="line-clamp-2 text-sm text-muted-foreground">{product.description}</p>
        )}
        <div className="flex items-center justify-between border-t pt-2">
          <span className="text-xs text-muted-foreground">Disponible</span>
          <Switch checked={product.isActive} onCheckedChange={onToggle} />
        </div>
      </CardContent>
    </Card>
  )
}