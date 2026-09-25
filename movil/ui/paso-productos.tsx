import { useMemo, useState } from "react"

import { getProductPrice } from "@/lib/calc"
import type { Product, QuoteItem } from "@/lib/types"
import { formatCurrency } from "@/lib/utils"

import { PastillaColor } from "./pastilla-color"

export function PasoProductos({
  productos,
  eventTypeId,
  items,
  alCambiar,
}: {
  productos: Product[]
  eventTypeId: string | null
  items: QuoteItem[]
  alCambiar: (items: QuoteItem[]) => void
}) {
  const [busqueda, setBusqueda] = useState("")
  const [libre, setLibre] = useState(false)
  const [nombreLibre, setNombreLibre] = useState("")
  const [precioLibre, setPrecioLibre] = useState("")

  const disponibles = useMemo(() => {
    const termino = busqueda.trim().toLowerCase()
    if (!termino) return []
    return productos
      .filter((p) => p.isActive)
      .filter(
        (p) =>
          p.name.toLowerCase().includes(termino) ||
          (p.description ?? "").toLowerCase().includes(termino),
      )
      .slice(0, 25)
  }, [productos, busqueda])

  function agregar(producto: Product) {
    const existente = items.find((i) => i.productId === producto.id)
    if (existente) {
      cambiarCantidad(existente.id, existente.quantity + 1)
      return
    }
    alCambiar([
      ...items,
      {
        id: crypto.randomUUID(),
        productId: producto.id,
        name: producto.name,
        description: producto.description ?? null,
        quantity: 1,
        unitPrice: getProductPrice(producto, eventTypeId),
      },
    ])
    setBusqueda("")
  }

  function agregarLibre() {
    const precio = Number(precioLibre)
    if (!nombreLibre.trim() || !Number.isFinite(precio)) return
    alCambiar([
      ...items,
      {
        id: crypto.randomUUID(),
        productId: null,
        name: nombreLibre.trim(),
        description: null,
        quantity: 1,
        unitPrice: precio,
      },
    ])
    setNombreLibre("")
    setPrecioLibre("")
    setLibre(false)
  }

  function cambiarCantidad(id: string, cantidad: number) {
    if (cantidad <= 0) {
      alCambiar(items.filter((i) => i.id !== id))
      return
    }
    alCambiar(items.map((i) => (i.id === id ? { ...i, quantity: cantidad } : i)))
  }

  function cambiarPrecio(id: string, precio: number) {
    alCambiar(items.map((i) => (i.id === id ? { ...i, unitPrice: precio } : i)))
  }

  return (
    <section className="seccion">
      <input
        type="search"
        className="campo buscador"
        placeholder="Buscar para agregar..."
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
      />

      {disponibles.length > 0 && (
        <ul className="lista resultados">
          {disponibles.map((producto) => (
            <li key={producto.id}>
              <button type="button" className="fila pulsable" onClick={() => agregar(producto)}>
                <PastillaColor id={producto.id} nombre={producto.name} tamano={38} />
                <div className="fila-cuerpo">
                  <span className="fila-titulo">{producto.name}</span>
                  {producto.category && <span className="fila-sub">{producto.category}</span>}
                </div>
                <span className="fila-precio">
                  {formatCurrency(getProductPrice(producto, eventTypeId))}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {items.length === 0 && !busqueda && (
        <p className="apagado centro">Busca un producto para empezar.</p>
      )}

      {items.map((item) => (
        <div key={item.id} className="item">
          <div className="item-cabecera">
            <span className="fila-titulo">{item.name}</span>
            <button
              type="button"
              className="boton icono"
              aria-label={`Quitar ${item.name}`}
              onClick={() => cambiarCantidad(item.id, 0)}
            >
              ×
            </button>
          </div>

          <div className="item-controles">
            <div className="contador">
              <button
                type="button"
                aria-label="Quitar uno"
                onClick={() => cambiarCantidad(item.id, item.quantity - 1)}
              >
                −
              </button>
              <input
                type="number"
                inputMode="numeric"
                min={1}
                value={item.quantity}
                onChange={(e) => cambiarCantidad(item.id, Number(e.target.value))}
              />
              <button
                type="button"
                aria-label="Agregar uno"
                onClick={() => cambiarCantidad(item.id, item.quantity + 1)}
              >
                +
              </button>
            </div>

            <label className="precio-unitario">
              <span className="etiqueta">P. unitario</span>
              <input
                type="number"
                inputMode="decimal"
                min={0}
                step="0.01"
                value={item.unitPrice}
                onChange={(e) => cambiarPrecio(item.id, Number(e.target.value))}
              />
            </label>
          </div>

          <div className="item-importe">
            <span className="apagado">Importe</span>
            <strong>{formatCurrency(item.quantity * item.unitPrice)}</strong>
          </div>
        </div>
      ))}

      {libre ? (
        <div className="item">
          <label className="campo-etiquetado">
            <span className="etiqueta">Concepto</span>
            <input
              className="campo"
              value={nombreLibre}
              onChange={(e) => setNombreLibre(e.target.value)}
              placeholder="Servicio adicional"
              autoFocus
            />
          </label>
          <label className="campo-etiquetado">
            <span className="etiqueta">Precio</span>
            <input
              className="campo"
              type="number"
              inputMode="decimal"
              value={precioLibre}
              onChange={(e) => setPrecioLibre(e.target.value)}
              placeholder="0.00"
            />
          </label>
          <div className="par-botones">
            <button type="button" className="boton fantasma" onClick={() => setLibre(false)}>
              Cancelar
            </button>
            <button type="button" className="boton primario" onClick={agregarLibre}>
              Agregar
            </button>
          </div>
        </div>
      ) : (
        <button type="button" className="boton secundario ancho" onClick={() => setLibre(true)}>
          + Concepto libre
        </button>
      )}
    </section>
  )
}
