import { useState } from "react"

import type { QuoteTotals } from "@/lib/calc"
import type { Quote, QuoteFormatSettings } from "@/lib/types"
import { formatCurrency } from "@/lib/utils"

import { compartirPdf, generarPdfBlob } from "../pdf"
import type { BorradorCotizacion } from "./asistente"

type Estado =
  | { tipo: "editando" }
  | { tipo: "generando" }
  | { tipo: "listo"; quote: Quote }
  | { tipo: "error"; mensaje: string }

export function PasoResumen({
  borrador,
  totales,
  quoteFormat,
  alCambiar,
  alGuardar,
  alTerminar,
}: {
  borrador: BorradorCotizacion
  totales: QuoteTotals
  quoteFormat: QuoteFormatSettings | null
  alCambiar: (cambios: Partial<BorradorCotizacion>) => void
  alGuardar: () => Promise<Quote>
  alTerminar: () => void
}) {
  const [estado, setEstado] = useState<Estado>({ tipo: "editando" })

  const anticipo = Number(borrador.deposit) || 0
  const saldo = Math.max(0, totales.total - anticipo)
  // Mismas condiciones que el PDF, para que la pantalla no muestre de más.
  const verDescuento = totales.discount > 0.004
  const verImpuesto = borrador.taxRate > 0

  async function generar() {
    if (!quoteFormat) {
      setEstado({
        tipo: "error",
        mensaje: "Falta el formato de cotización. Importa el archivo de la computadora.",
      })
      return
    }

    setEstado({ tipo: "generando" })
    try {
      const quote = await alGuardar()
      const blob = await generarPdfBlob(quote, quoteFormat)
      await compartirPdf(blob, quote)
      setEstado({ tipo: "listo", quote })
    } catch (error) {
      setEstado({
        tipo: "error",
        mensaje: error instanceof Error ? error.message : "No se pudo generar el PDF.",
      })
    }
  }

  if (estado.tipo === "listo") {
    return (
      <section className="seccion">
        <div className="aviso exito grande">
          <strong>Cotización {estado.quote.code} generada</strong>
          <span>Guardada en este teléfono y lista para compartir.</span>
        </div>
        <button
          type="button"
          className="boton secundario ancho"
          onClick={async () => {
            if (!quoteFormat) return
            const blob = await generarPdfBlob(estado.quote, quoteFormat)
            await compartirPdf(blob, estado.quote)
          }}
        >
          Compartir de nuevo
        </button>
        <button type="button" className="boton primario ancho" onClick={alTerminar}>
          Nueva cotización
        </button>
      </section>
    )
  }

  return (
    <section className="seccion">
      <label className="campo-etiquetado">
        <span className="etiqueta">Folio</span>
        <input
          className="campo"
          value={borrador.code}
          onChange={(e) => alCambiar({ code: e.target.value })}
        />
        <span className="ayuda">
          Edítalo si en la computadora ya existe uno con este número.
        </span>
      </label>

      <div className="rejilla-2">
        <label className="campo-etiquetado">
          <span className="etiqueta">Descuento</span>
          <input
            className="campo"
            type="number"
            inputMode="decimal"
            min={0}
            value={borrador.discountValue}
            onChange={(e) => alCambiar({ discountValue: Number(e.target.value) })}
          />
        </label>
        <label className="campo-etiquetado">
          <span className="etiqueta">Tipo</span>
          <select
            className="campo"
            value={borrador.discountType}
            onChange={(e) =>
              alCambiar({ discountType: e.target.value as BorradorCotizacion["discountType"] })
            }
          >
            <option value="percent">Porcentaje</option>
            <option value="fixed">Monto fijo</option>
          </select>
        </label>
      </div>

      <div className="rejilla-2">
        <label className="campo-etiquetado">
          <span className="etiqueta">Impuesto %</span>
          <input
            className="campo"
            type="number"
            inputMode="decimal"
            min={0}
            value={borrador.taxRate}
            onChange={(e) => alCambiar({ taxRate: Number(e.target.value) })}
          />
        </label>
        <label className="campo-etiquetado">
          <span className="etiqueta">Anticipo</span>
          <input
            className="campo"
            type="number"
            inputMode="decimal"
            min={0}
            value={borrador.deposit ?? ""}
            onChange={(e) =>
              alCambiar({ deposit: e.target.value === "" ? null : Number(e.target.value) })
            }
          />
        </label>
      </div>

      <label className="campo-etiquetado">
        <span className="etiqueta">Válida hasta</span>
        <input
          className="campo"
          type="date"
          value={borrador.validUntil ?? ""}
          onChange={(e) => alCambiar({ validUntil: e.target.value || null })}
        />
      </label>

      <label className="campo-etiquetado">
        <span className="etiqueta">Notas</span>
        <textarea
          className="campo"
          rows={3}
          value={borrador.notes ?? ""}
          onChange={(e) => alCambiar({ notes: e.target.value || null })}
          placeholder="Detalles, condiciones, entregas..."
        />
      </label>

      <div className="desglose">
        <div className="desglose-fila">
          <span>Subtotal</span>
          <span>{formatCurrency(totales.subtotal)}</span>
        </div>
        {verDescuento && (
          <div className="desglose-fila">
            <span>
              Descuento ({borrador.discountType === "percent" ? `${borrador.discountValue}%` : "fijo"})
            </span>
            <span className="rojo">−{formatCurrency(totales.discount)}</span>
          </div>
        )}
        {verImpuesto && (
          <div className="desglose-fila">
            <span>Impuesto ({borrador.taxRate}%)</span>
            <span>{formatCurrency(totales.tax)}</span>
          </div>
        )}
        <div className="desglose-fila total">
          <span>TOTAL</span>
          <span>{formatCurrency(totales.total)}</span>
        </div>
        {anticipo > 0 && (
          <>
            <div className="desglose-fila">
              <span>Anticipo pagado</span>
              <span className="verde">−{formatCurrency(anticipo)}</span>
            </div>
            <div className="desglose-fila saldo">
              <span>SALDO POR PAGAR</span>
              <span>{formatCurrency(saldo)}</span>
            </div>
          </>
        )}
      </div>

      {estado.tipo === "error" && <div className="aviso error">{estado.mensaje}</div>}

      <button
        type="button"
        className="boton primario ancho alto"
        disabled={estado.tipo === "generando"}
        onClick={generar}
      >
        {estado.tipo === "generando" ? "Generando PDF..." : "Generar cotización"}
      </button>
    </section>
  )
}
