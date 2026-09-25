import { useEffect, useRef, useState } from "react"

import { formatDate } from "@/lib/utils"

import { modoAlmacenamiento } from "../db"
import {
  contarPendientes,
  descargarExportacion,
  importar,
  leerArchivoBackup,
  leerResumenGuardado,
  type PendientesExportacion,
  type ResumenImportacion,
} from "../import-export"

type Estado =
  | { tipo: "reposo" }
  | { tipo: "leyendo" }
  | { tipo: "listo"; resumen: ResumenImportacion }
  | { tipo: "error"; mensaje: string }

export function PantallaDatos({ alImportar }: { alImportar: () => void }) {
  const entrada = useRef<HTMLInputElement>(null)
  const [estado, setEstado] = useState<Estado>({ tipo: "reposo" })
  const [ultima, setUltima] = useState<string | null>(null)
  const [pendientes, setPendientes] = useState<PendientesExportacion>({
    cotizaciones: 0,
    clientes: 0,
  })

  async function refrescar() {
    setUltima(await leerResumenGuardado())
    setPendientes(await contarPendientes())
  }

  useEffect(() => {
    void refrescar()
  }, [])

  async function alElegirArchivo(evento: React.ChangeEvent<HTMLInputElement>) {
    const archivo = evento.target.files?.[0]
    evento.target.value = ""
    if (!archivo) return

    setEstado({ tipo: "leyendo" })
    const datos = await leerArchivoBackup(archivo)

    if (!datos) {
      setEstado({
        tipo: "error",
        mensaje: "Ese archivo no es un respaldo de AcuarelaCRM.",
      })
      return
    }

    const resumen = await importar(datos)
    setEstado({ tipo: "listo", resumen })
    await refrescar()
    alImportar()
  }

  const sinExportar = pendientes.cotizaciones === 0 && pendientes.clientes === 0

  return (
    <div className="pantalla">
      <h1>Datos</h1>
      <p className="apagado">Trae tu catálogo y regresa tus cotizaciones.</p>

      <section className="tarjeta">
        <h2>Importar catálogo</h2>
        <p className="apagado">
          Selecciona el archivo <code>DataAcuarelaCRM_*.json</code> que exportaste desde la
          computadora.
        </p>

        <input
          ref={entrada}
          type="file"
          accept="application/json,.json"
          onChange={alElegirArchivo}
          hidden
        />
        <button
          type="button"
          className="boton primario ancho"
          onClick={() => entrada.current?.click()}
          disabled={estado.tipo === "leyendo"}
        >
          {estado.tipo === "leyendo" ? "Leyendo..." : "Elegir archivo"}
        </button>

        {estado.tipo === "listo" && (
          <div className="aviso exito">
            <strong>Importado correctamente</strong>
            <span>
              {estado.resumen.productos} productos · {estado.resumen.clientes} clientes ·{" "}
              {estado.resumen.tiposEvento} tipos de evento
            </span>
          </div>
        )}

        {estado.tipo === "error" && <div className="aviso error">{estado.mensaje}</div>}

        {ultima && estado.tipo !== "listo" && (
          <p className="apagado pie">Última importación: {formatDate(ultima)}</p>
        )}

        <p className="apagado pie">
          Tus cotizaciones nunca se borran al importar. Las imágenes no se guardan.
        </p>
      </section>

      <section className="tarjeta">
        <h2>Exportar a la computadora</h2>

        {sinExportar ? (
          <p className="apagado">Todavía no hay nada nuevo que regresar.</p>
        ) : (
          <>
            <div className="aviso neutro">
              <strong>
                {pendientes.cotizaciones}{" "}
                {pendientes.cotizaciones === 1 ? "cotización" : "cotizaciones"}
                {pendientes.clientes > 0 &&
                  ` · ${pendientes.clientes} ${
                    pendientes.clientes === 1 ? "cliente" : "clientes"
                  }`}
              </strong>
              <span>Creadas en este teléfono, pendientes de reintegrar.</span>
            </div>
            <button
              type="button"
              className="boton primario ancho"
              onClick={() => void descargarExportacion()}
            >
              Exportar archivo
            </button>
            <p className="apagado pie">
              En la computadora: <strong>Datos → Importar → Agregar</strong>. Nunca uses
              «Reemplazar todo» con este archivo.
            </p>
          </>
        )}
      </section>

      <p className="apagado pie centro">Almacenamiento: {modoAlmacenamiento()}</p>
    </div>
  )
}
