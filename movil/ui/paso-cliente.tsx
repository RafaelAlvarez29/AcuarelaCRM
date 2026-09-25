import { useMemo, useState } from "react"

import type { Client } from "@/lib/types"

import type { BorradorCotizacion } from "./asistente"
import { PastillaColor } from "./pastilla-color"

export function PasoCliente({
  clientes,
  borrador,
  alElegir,
  alCrear,
}: {
  clientes: Client[]
  borrador: BorradorCotizacion
  alElegir: (cambios: Partial<BorradorCotizacion>) => void
  alCrear: (nombre: string, whatsapp: string) => Promise<void>
}) {
  const [busqueda, setBusqueda] = useState("")
  const [creando, setCreando] = useState(false)
  const [nombre, setNombre] = useState("")
  const [whatsapp, setWhatsapp] = useState("")

  const resultados = useMemo(() => {
    const termino = busqueda.trim().toLowerCase()
    return clientes
      .filter((c) => c.isActive)
      .filter((c) => {
        if (!termino) return true
        return (
          c.name.toLowerCase().includes(termino) ||
          (c.whatsapp_number ?? "").includes(termino)
        )
      })
      .sort((a, b) => a.name.localeCompare(b.name, "es"))
      .slice(0, 40)
  }, [clientes, busqueda])

  if (creando) {
    const valido = nombre.trim().length > 0 && whatsapp.trim().length > 0
    return (
      <section className="seccion">
        <label className="campo-etiquetado">
          <span className="etiqueta">Nombre</span>
          <input
            className="campo"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Nombre del cliente"
            autoFocus
          />
        </label>

        <label className="campo-etiquetado">
          <span className="etiqueta">WhatsApp</span>
          <input
            className="campo"
            type="tel"
            inputMode="tel"
            value={whatsapp}
            onChange={(e) => setWhatsapp(e.target.value)}
            placeholder="668 254 8438"
          />
        </label>

        <div className="par-botones">
          <button type="button" className="boton fantasma" onClick={() => setCreando(false)}>
            Cancelar
          </button>
          <button
            type="button"
            className="boton primario"
            disabled={!valido}
            onClick={async () => {
              await alCrear(nombre, whatsapp)
              setCreando(false)
              setNombre("")
              setWhatsapp("")
            }}
          >
            Guardar cliente
          </button>
        </div>
      </section>
    )
  }

  return (
    <section className="seccion">
      {borrador.clientName && (
        <div className="aviso exito">
          <strong>{borrador.clientName}</strong>
          <span>{borrador.clientPhone || "Sin teléfono"}</span>
        </div>
      )}

      <input
        type="search"
        className="campo buscador"
        placeholder="Buscar cliente..."
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
      />

      <button type="button" className="boton secundario ancho" onClick={() => setCreando(true)}>
        + Cliente nuevo
      </button>

      <ul className="lista">
        {resultados.map((cliente) => (
          <li key={cliente.id}>
            <button
              type="button"
              className={`fila pulsable ${borrador.clientId === cliente.id ? "elegida" : ""}`}
              onClick={() =>
                alElegir({
                  clientId: cliente.id,
                  clientName: cliente.name,
                  clientPhone: cliente.whatsapp_number,
                  clientEmail: cliente.email ?? null,
                })
              }
            >
              <PastillaColor id={cliente.id} nombre={cliente.name} tamano={40} />
              <div className="fila-cuerpo">
                <span className="fila-titulo">{cliente.name}</span>
                <span className="fila-sub">{cliente.whatsapp_number}</span>
              </div>
            </button>
          </li>
        ))}
      </ul>

      {resultados.length === 0 && (
        <p className="apagado centro">
          Sin coincidencias. Usa «Cliente nuevo» para capturarlo.
        </p>
      )}
    </section>
  )
}
