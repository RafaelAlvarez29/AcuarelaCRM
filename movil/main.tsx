import { StrictMode, useEffect, useState } from "react"
import { createRoot } from "react-dom/client"

import { abrirDB } from "./db"
import { Asistente } from "./ui/asistente"
import { PantallaDatos } from "./ui/pantalla-datos"
import { PantallaProductos } from "./ui/pantalla-productos"

import "./index.css"

type Pestana = "cotizar" | "productos" | "datos"

const PESTANAS: { id: Pestana; texto: string; icono: string }[] = [
  { id: "cotizar", texto: "Cotizar", icono: "◆" },
  { id: "productos", texto: "Productos", icono: "▤" },
  { id: "datos", texto: "Datos", icono: "⇅" },
]

function App() {
  const [lista, setLista] = useState(false)
  const [pestana, setPestana] = useState<Pestana>("cotizar")
  // Se incrementa al importar para que las pantallas recarguen sus datos.
  const [version, setVersion] = useState(0)

  useEffect(() => {
    void abrirDB().then(() => setLista(true))
  }, [])

  if (!lista) {
    return (
      <div className="pantalla">
        <p className="apagado centro">Abriendo...</p>
      </div>
    )
  }

  return (
    <>
      <main className="contenido">
        {pestana === "cotizar" && <Asistente key={version} version={version} />}
        {pestana === "productos" && <PantallaProductos version={version} />}
        {pestana === "datos" && (
          <PantallaDatos alImportar={() => setVersion((v) => v + 1)} />
        )}
      </main>

      <nav className="navegacion" aria-label="Secciones">
        {PESTANAS.map((p) => (
          <button
            key={p.id}
            type="button"
            className={`nav-boton ${pestana === p.id ? "activo" : ""}`}
            aria-current={pestana === p.id ? "page" : undefined}
            onClick={() => setPestana(p.id)}
          >
            <span className="nav-icono" aria-hidden="true">
              {p.icono}
            </span>
            <span>{p.texto}</span>
          </button>
        ))}
      </nav>
    </>
  )
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
