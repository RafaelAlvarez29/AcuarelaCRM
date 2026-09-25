import type { EventType } from "@/lib/types"

export function PasoEvento({
  tiposEvento,
  seleccionado,
  alElegir,
}: {
  tiposEvento: EventType[]
  seleccionado: string | null
  alElegir: (evento: EventType | null) => void
}) {
  const activos = tiposEvento
    .filter((e) => e.isActive)
    .sort((a, b) => a.name.localeCompare(b.name, "es"))

  return (
    <section className="seccion">
      <p className="apagado">
        Determina el precio de cada producto y la serie del folio.
      </p>

      <ul className="lista">
        <li>
          <button
            type="button"
            className={`fila pulsable ${seleccionado === null ? "elegida" : ""}`}
            onClick={() => alElegir(null)}
          >
            <div className="fila-cuerpo">
              <span className="fila-titulo">General</span>
              <span className="fila-sub">Precio base · folio CT</span>
            </div>
          </button>
        </li>

        {activos.map((evento) => (
          <li key={evento.id}>
            <button
              type="button"
              className={`fila pulsable ${seleccionado === evento.id ? "elegida" : ""}`}
              onClick={() => alElegir(evento)}
            >
              <div className="fila-cuerpo">
                <span className="fila-titulo">{evento.name}</span>
                {evento.series && (
                  <span className="fila-sub">Folio {evento.series.toUpperCase()}</span>
                )}
              </div>
            </button>
          </li>
        ))}
      </ul>

      {activos.length === 0 && (
        <p className="apagado centro">
          No hay tipos de evento en tu catálogo. Se usará el precio base.
        </p>
      )}
    </section>
  )
}
