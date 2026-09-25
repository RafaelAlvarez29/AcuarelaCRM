import { useEffect, useMemo, useState } from "react"

import { getProductPrice } from "@/lib/calc"
import type { EventType, Product } from "@/lib/types"
import { formatCurrency } from "@/lib/utils"

import { leerColeccion } from "../db"
import { PastillaColor } from "./pastilla-color"

const TODAS = "__todas__"

export function PantallaProductos({ version }: { version: number }) {
  const [productos, setProductos] = useState<Product[]>([])
  const [tiposEvento, setTiposEvento] = useState<EventType[]>([])
  const [busqueda, setBusqueda] = useState("")
  const [categoria, setCategoria] = useState(TODAS)
  const [eventoId, setEventoId] = useState<string | null>(null)

  useEffect(() => {
    void (async () => {
      setProductos(await leerColeccion<Product>("products"))
      setTiposEvento(await leerColeccion<EventType>("eventTypes"))
    })()
  }, [version])

  const categorias = useMemo(() => {
    const vistas = new Set<string>()
    for (const p of productos) if (p.category) vistas.add(p.category)
    return [...vistas].sort((a, b) => a.localeCompare(b, "es"))
  }, [productos])

  const visibles = useMemo(() => {
    const termino = busqueda.trim().toLowerCase()
    return productos
      .filter((p) => p.isActive)
      .filter((p) => categoria === TODAS || p.category === categoria)
      .filter((p) => {
        if (!termino) return true
        return (
          p.name.toLowerCase().includes(termino) ||
          (p.description ?? "").toLowerCase().includes(termino)
        )
      })
      .sort((a, b) => a.name.localeCompare(b.name, "es"))
  }, [productos, busqueda, categoria])

  const eventosActivos = tiposEvento.filter((e) => e.isActive)

  if (productos.length === 0) {
    return (
      <div className="pantalla">
        <h1>Productos</h1>
        <div className="vacio">
          <p>Aún no has importado tu catálogo.</p>
          <p className="apagado">Ve a la pestaña Datos para traerlo.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="pantalla">
      <h1>Productos</h1>
      <p className="apagado">{visibles.length} de {productos.length}</p>

      <input
        type="search"
        className="campo buscador"
        placeholder="Buscar producto..."
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
      />

      {eventosActivos.length > 0 && (
        <label className="campo-etiquetado">
          <span className="etiqueta">Ver precios para</span>
          <select
            className="campo"
            value={eventoId ?? ""}
            onChange={(e) => setEventoId(e.target.value || null)}
          >
            <option value="">Precio base</option>
            {eventosActivos.map((evento) => (
              <option key={evento.id} value={evento.id}>
                {evento.name}
              </option>
            ))}
          </select>
        </label>
      )}

      {categorias.length > 0 && (
        <div className="chips">
          <button
            type="button"
            className={`chip ${categoria === TODAS ? "activo" : ""}`}
            onClick={() => setCategoria(TODAS)}
          >
            Todas
          </button>
          {categorias.map((c) => (
            <button
              key={c}
              type="button"
              className={`chip ${categoria === c ? "activo" : ""}`}
              onClick={() => setCategoria(c)}
            >
              {c}
            </button>
          ))}
        </div>
      )}

      <ul className="lista">
        {visibles.map((producto) => {
          const precio = getProductPrice(producto, eventoId)
          const base = Number(producto.price || 0)
          const difiere = eventoId !== null && Math.abs(precio - base) > 0.004
          return (
            <li key={producto.id} className="fila">
              <PastillaColor id={producto.id} nombre={producto.name} />
              <div className="fila-cuerpo">
                <span className="fila-titulo">{producto.name}</span>
                {producto.description && (
                  <span className="fila-sub">{producto.description}</span>
                )}
                {producto.category && <span className="fila-meta">{producto.category}</span>}
              </div>
              <div className="fila-precio">
                <strong>{formatCurrency(precio)}</strong>
                {difiere && <span className="tachado">{formatCurrency(base)}</span>}
              </div>
            </li>
          )
        })}
      </ul>

      {visibles.length === 0 && (
        <div className="vacio">
          <p className="apagado">Ningún producto coincide con la búsqueda.</p>
        </div>
      )}
    </div>
  )
}
