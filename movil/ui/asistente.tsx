import { useEffect, useMemo, useState } from "react"

import { quoteTotals } from "@/lib/calc"
import type {
  Client,
  EventType,
  Product,
  Quote,
  QuoteDiscountType,
  QuoteItem,
  Settings,
} from "@/lib/types"
import { formatCurrency } from "@/lib/utils"

import { guardarUno, leerColeccion, marcarOrigenMovil } from "../db"
import { siguienteFolio } from "../folio"
import { leerSettings } from "../import-export"
import { PasoCliente } from "./paso-cliente"
import { PasoEvento } from "./paso-evento"
import { PasoProductos } from "./paso-productos"
import { PasoResumen } from "./paso-resumen"

export interface BorradorCotizacion {
  clientId: string | null
  clientName: string
  clientPhone: string
  clientEmail: string | null
  eventTypeId: string | null
  eventTypeName: string | null
  items: QuoteItem[]
  discountType: QuoteDiscountType
  discountValue: number
  taxRate: number
  deposit: number | null
  notes: string | null
  code: string
  validUntil: string | null
}

function borradorVacio(): BorradorCotizacion {
  return {
    clientId: null,
    clientName: "",
    clientPhone: "",
    clientEmail: null,
    eventTypeId: null,
    eventTypeName: null,
    items: [],
    discountType: "percent",
    discountValue: 0,
    taxRate: 0,
    deposit: null,
    notes: null,
    code: "",
    validUntil: null,
  }
}

const TITULOS = ["Cliente", "Evento", "Productos", "Resumen"]

export function Asistente({ version }: { version: number }) {
  const [paso, setPaso] = useState(1)
  const [borrador, setBorrador] = useState<BorradorCotizacion>(borradorVacio)

  const [clientes, setClientes] = useState<Client[]>([])
  const [tiposEvento, setTiposEvento] = useState<EventType[]>([])
  const [productos, setProductos] = useState<Product[]>([])
  const [cotizaciones, setCotizaciones] = useState<Quote[]>([])
  const [settings, setSettings] = useState<Settings | null>(null)

  useEffect(() => {
    void (async () => {
      const [c, e, p, q, s] = await Promise.all([
        leerColeccion<Client>("clients"),
        leerColeccion<EventType>("eventTypes"),
        leerColeccion<Product>("products"),
        leerColeccion<Quote>("quotes"),
        leerSettings(),
      ])
      setClientes(c)
      setTiposEvento(e)
      setProductos(p)
      setCotizaciones(q)
      setSettings(s)
      setBorrador((b) => (b.code ? b : { ...b, code: siguienteFolio(q, null) }))
    })()
  }, [version])

  const totales = useMemo(() => quoteTotals(borrador), [borrador])

  function actualizar(cambios: Partial<BorradorCotizacion>) {
    setBorrador((b) => ({ ...b, ...cambios }))
  }

  /** Recalcula el folio cuando cambia la serie del tipo de evento. */
  function elegirEvento(evento: EventType | null) {
    actualizar({
      eventTypeId: evento?.id ?? null,
      eventTypeName: evento?.name ?? null,
      code: siguienteFolio(cotizaciones, evento?.series ?? null),
      // Los precios dependen del tipo de evento: se reajustan los ya agregados.
      items: borrador.items.map((item) => {
        if (!item.productId) return item
        const producto = productos.find((p) => p.id === item.productId)
        if (!producto) return item
        const precio =
          evento && producto.priceByEventType?.[evento.id] !== undefined
            ? Number(producto.priceByEventType[evento.id])
            : Number(producto.price || 0)
        return Number.isFinite(precio) ? { ...item, unitPrice: precio } : item
      }),
    })
  }

  async function crearCliente(nombre: string, whatsapp: string) {
    const id = crypto.randomUUID()
    const cliente: Client = {
      id,
      name: nombre.trim(),
      whatsapp_number: whatsapp.trim(),
      email: null,
      photoBase64: null,
      creationDate: new Date().toISOString(),
      isActive: true,
    }
    await guardarUno<Client>("clients", cliente)
    await marcarOrigenMovil(id)
    setClientes((lista) => [...lista, cliente])
    actualizar({
      clientId: id,
      clientName: cliente.name,
      clientPhone: cliente.whatsapp_number,
      clientEmail: null,
    })
  }

  async function guardarCotizacion(): Promise<Quote> {
    const id = crypto.randomUUID()
    const cotizacion: Quote = {
      id,
      code: borrador.code,
      clientId: borrador.clientId,
      clientName: borrador.clientName,
      clientPhone: borrador.clientPhone,
      clientEmail: borrador.clientEmail,
      eventTypeId: borrador.eventTypeId,
      eventTypeName: borrador.eventTypeName,
      items: borrador.items,
      discountType: borrador.discountType,
      discountValue: borrador.discountValue,
      taxRate: borrador.taxRate,
      deposit: borrador.deposit,
      notes: borrador.notes,
      status: "Borrador",
      createdAt: new Date().toISOString(),
      validUntil: borrador.validUntil,
    }
    await guardarUno<Quote>("quotes", cotizacion)
    await marcarOrigenMovil(id)
    setCotizaciones((lista) => [...lista, cotizacion])
    return cotizacion
  }

  function reiniciar() {
    setBorrador({ ...borradorVacio(), code: siguienteFolio(cotizaciones, null) })
    setPaso(1)
  }

  if (productos.length === 0 && clientes.length === 0) {
    return (
      <div className="pantalla">
        <h1>Cotizar</h1>
        <div className="vacio">
          <p>Necesitas importar tu catálogo primero.</p>
          <p className="apagado">Ve a la pestaña Datos y trae el archivo de la computadora.</p>
        </div>
      </div>
    )
  }

  const puedeAvanzar =
    paso === 1
      ? borrador.clientName.trim().length > 0
      : paso === 3
        ? borrador.items.length > 0
        : true

  return (
    <div className="pantalla con-barra">
      <header className="cabecera-asistente">
        <div>
          <h1>{TITULOS[paso - 1]}</h1>
          <p className="apagado">
            Paso {paso} de 4 · <span className="folio">{borrador.code}</span>
          </p>
        </div>
        {paso > 1 && (
          <button type="button" className="boton fantasma" onClick={() => setPaso(paso - 1)}>
            Atrás
          </button>
        )}
      </header>

      <ol className="pasos" aria-label="Progreso">
        {TITULOS.map((titulo, indice) => (
          <li
            key={titulo}
            className={indice + 1 === paso ? "actual" : indice + 1 < paso ? "hecho" : ""}
          />
        ))}
      </ol>

      {paso === 1 && (
        <PasoCliente
          clientes={clientes}
          borrador={borrador}
          alElegir={actualizar}
          alCrear={crearCliente}
        />
      )}
      {paso === 2 && (
        <PasoEvento
          tiposEvento={tiposEvento}
          seleccionado={borrador.eventTypeId}
          alElegir={elegirEvento}
        />
      )}
      {paso === 3 && (
        <PasoProductos
          productos={productos}
          eventTypeId={borrador.eventTypeId}
          items={borrador.items}
          alCambiar={(items) => actualizar({ items })}
        />
      )}
      {paso === 4 && (
        <PasoResumen
          borrador={borrador}
          totales={totales}
          quoteFormat={settings?.quoteFormat ?? null}
          alCambiar={actualizar}
          alGuardar={guardarCotizacion}
          alTerminar={reiniciar}
        />
      )}

      {paso < 4 && (
        <div className="barra-total">
          <div>
            <span className="apagado">Total</span>
            <strong>{formatCurrency(totales.total)}</strong>
          </div>
          <button
            type="button"
            className="boton primario"
            disabled={!puedeAvanzar}
            onClick={() => setPaso(paso + 1)}
          >
            Continuar
          </button>
        </div>
      )}
    </div>
  )
}
