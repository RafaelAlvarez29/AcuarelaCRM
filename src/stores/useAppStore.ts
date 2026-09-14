import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"

import { APP_STORAGE_KEY, DEFAULT_MESSAGES, DEFAULT_QUOTE_FORMAT } from "@/lib/constants"
import { uid } from "@/lib/utils"
import type {
  AppData,
  Client,
  EventType,
  Payment,
  Product,
  Project,
  Quote,
  QuoteFormatSettings,
  Settings,
} from "@/lib/types"

/** Datos iniciales vacíos: la app siempre arranca limpia, sin clientes ni productos de ejemplo. */
function emptyAppData(): AppData {
  return {
    clients: [],
    projects: [],
    payments: [],
    eventTypes: [],
    settings: {
      messages: { ...DEFAULT_MESSAGES },
      quoteFormat: { ...DEFAULT_QUOTE_FORMAT },
    },
    products: [],
    quotes: [],
  }
}

function loadInitialData(): AppData {
  return emptyAppData()
}

/** Garantiza settings.messages y settings.quoteFormat completos. */
function normalizeSettings(settings: Settings | undefined | null): Settings {
  const rawMessages =
    settings && settings.messages && typeof settings.messages === "object"
      ? (settings.messages as Record<string, string>)
      : {}
  const messages: Record<string, string> = { ...DEFAULT_MESSAGES }
  for (const [status, template] of Object.entries(rawMessages)) {
    if (typeof template === "string") messages[status] = template
  }

  const rawFormat =
    settings && settings.quoteFormat && typeof settings.quoteFormat === "object"
      ? (settings.quoteFormat as Partial<QuoteFormatSettings>)
      : {}
  const quoteFormat: QuoteFormatSettings = {
    businessName:
      typeof rawFormat.businessName === "string" ? rawFormat.businessName : DEFAULT_QUOTE_FORMAT.businessName,
    address: typeof rawFormat.address === "string" ? rawFormat.address : DEFAULT_QUOTE_FORMAT.address,
    phone: typeof rawFormat.phone === "string" ? rawFormat.phone : DEFAULT_QUOTE_FORMAT.phone,
    mapsUrl: typeof rawFormat.mapsUrl === "string" ? rawFormat.mapsUrl : DEFAULT_QUOTE_FORMAT.mapsUrl,
    whatsappMessage:
      typeof rawFormat.whatsappMessage === "string"
        ? rawFormat.whatsappMessage
        : DEFAULT_QUOTE_FORMAT.whatsappMessage,
    validityText:
      typeof rawFormat.validityText === "string" ? rawFormat.validityText : DEFAULT_QUOTE_FORMAT.validityText,
    footerText:
      typeof rawFormat.footerText === "string" ? rawFormat.footerText : DEFAULT_QUOTE_FORMAT.footerText,
  }

  return { messages, quoteFormat }
}

/** Normaliza productos para garantizar el mapa de precios por tipo de evento. */
function normalizeProducts(products: unknown[] | undefined): Product[] {
  if (!Array.isArray(products)) return []
  return products.map((p) => {
    const pp = (p ?? {}) as Record<string, unknown>
    const rawPrices =
      pp.priceByEventType && typeof pp.priceByEventType === "object"
        ? (pp.priceByEventType as Record<string, unknown>)
        : {}
    const priceByEventType: Record<string, number> = {}
    for (const [key, value] of Object.entries(rawPrices)) {
      const num = Number(value)
      if (Number.isFinite(num)) priceByEventType[key] = num
    }
    return {
      ...(pp as unknown as Product),
      price: Number(pp.price) || 0,
      priceByEventType,
    }
  })
}

/** Normaliza cotizaciones para garantizar los campos de tipo de evento y anticipo. */
function normalizeQuotes(quotes: unknown[] | undefined): Quote[] {
  if (!Array.isArray(quotes)) return []
  return quotes.map((q) => {
    const qq = (q ?? {}) as Record<string, unknown>
    const parsedDeposit = Number(qq.deposit)
    return {
      ...(qq as unknown as Quote),
      eventTypeId: qq.eventTypeId ? String(qq.eventTypeId) : null,
      eventTypeName: qq.eventTypeName ? String(qq.eventTypeName) : null,
      deposit: Number.isFinite(parsedDeposit) && parsedDeposit >= 0 ? parsedDeposit : 0,
    }
  })
}

function getNextQuoteCode(quotes: Quote[], series?: string | null): string {
  const prefix = series && series.trim() ? series.trim().toUpperCase() : "CT"
  let max = 0
  for (const quote of quotes) {
    if (quote.code.startsWith(`${prefix}-`)) {
      const num = Number.parseInt(quote.code.slice(prefix.length + 1), 10)
      if (Number.isFinite(num)) max = Math.max(max, num)
    }
  }
  return `${prefix}-${String(max + 1).padStart(4, "0")}`
}

interface AppStore extends AppData {
  // Clientes
  addClient: (data: {
    name: string
    whatsapp_number: string
    email?: string
    photoBase64?: string | null
  }) => string
  updateClient: (id: string, patch: Partial<Client>) => void
  deleteClient: (id: string) => void

  // Proyectos
  addProject: (data: Omit<Project, "id" | "creationDate">) => string
  updateProject: (id: string, patch: Partial<Project>) => void
  deleteProject: (id: string) => void

  // Pagos
  addPayment: (projectId: string, amount: number) => void
  removePayment: (id: string) => void

  // Ajustes
  updateMessage: (status: string, message: string) => void
  updateQuoteFormat: (patch: Partial<QuoteFormatSettings>) => void

  // Productos
  addProduct: (data: Omit<Product, "id" | "createdAt">) => string
  updateProduct: (id: string, patch: Partial<Product>) => void
  deleteProduct: (id: string) => void
  toggleProductActive: (id: string) => void

  // Tipos de evento
  addEventType: (data: { name: string; series?: string | null }) => string
  updateEventType: (id: string, patch: Partial<EventType>) => void
  toggleEventType: (id: string) => void
  deleteEventType: (id: string) => void

  // Cotizaciones
  addQuote: (data: Omit<Quote, "id" | "code" | "createdAt">) => string
  updateQuote: (id: string, patch: Partial<Quote>) => void
  deleteQuote: (id: string) => void

  // Datos
  replaceAll: (data: AppData) => void
  appendAll: (data: AppData) => void
  reset: () => void
}

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      ...loadInitialData(),

      addClient: (data) => {
        const id = uid()
        const client: Client = {
          id,
          name: data.name.trim(),
          whatsapp_number: data.whatsapp_number.trim(),
          email: data.email?.trim() || null,
          photoBase64: data.photoBase64 || null,
          creationDate: new Date().toISOString(),
          isActive: true,
        }
        set((s) => ({ clients: [...s.clients, client] }))
        return id
      },

      updateClient: (id, patch) =>
        set((s) => ({
          clients: s.clients.map((c) => (c.id === id ? { ...c, ...patch } : c)),
        })),

      deleteClient: (id) =>
        set((s) => {
          const projectIds = s.projects.filter((p) => p.clientId === id).map((p) => p.id)
          return {
            clients: s.clients.filter((c) => c.id !== id),
            projects: s.projects.filter((p) => p.clientId !== id),
            payments: s.payments.filter((p) => !projectIds.includes(p.projectId)),
            quotes: s.quotes.map((q) => (q.clientId === id ? { ...q, clientId: null } : q)),
          }
        }),

      addProject: (data) => {
        const id = uid()
        const now = new Date().toISOString()
        const columnProjects = get().projects.filter((p) => p.status === data.status)
        const order =
          data.order ??
          columnProjects.reduce((max, p) => Math.max(max, p.order ?? 0), -1) + 1
        const project: Project = {
          ...data,
          id,
          creationDate: now,
          lastUpdated: now,
          order,
        }
        set((s) => ({ projects: [...s.projects, project] }))
        return id
      },

      updateProject: (id, patch) =>
        set((s) => ({
          projects: s.projects.map((p) =>
            p.id === id
              ? { ...p, ...patch, lastUpdated: new Date().toISOString() }
              : p,
          ),
        })),

      deleteProject: (id) =>
        set((s) => ({
          projects: s.projects.filter((p) => p.id !== id),
          payments: s.payments.filter((p) => p.projectId !== id),
        })),

      addPayment: (projectId, amount) => {
        const payment: Payment = {
          id: uid(),
          projectId,
          amount: Number(amount) || 0,
          date: new Date().toISOString(),
        }
        set((s) => ({ payments: [...s.payments, payment] }))
      },

      removePayment: (id) =>
        set((s) => ({
          payments: s.payments.filter((p) => p.id !== id),
        })),

      updateMessage: (status, message) =>
        set((s) => ({
          settings: {
            messages: { ...s.settings.messages, [status]: message },
            quoteFormat: s.settings.quoteFormat,
          },
        })),

      updateQuoteFormat: (patch) =>
        set((s) => ({
          settings: {
            messages: s.settings.messages,
            quoteFormat: { ...s.settings.quoteFormat, ...patch },
          },
        })),

      addProduct: (data) => {
        const id = uid()
        const product: Product = {
          ...data,
          id,
          createdAt: new Date().toISOString(),
        }
        set((s) => ({ products: [...s.products, product] }))
        return id
      },

      updateProduct: (id, patch) =>
        set((s) => ({
          products: s.products.map((p) => (p.id === id ? { ...p, ...patch } : p)),
        })),

      deleteProduct: (id) =>
        set((s) => ({ products: s.products.filter((p) => p.id !== id) })),

      toggleProductActive: (id) =>
        set((s) => ({
          products: s.products.map((p) =>
            p.id === id ? { ...p, isActive: !p.isActive } : p,
          ),
        })),

      addQuote: (data) => {
        const id = uid()
        const eventType = data.eventTypeId
          ? get().eventTypes.find((e) => e.id === data.eventTypeId)
          : undefined
        const quote: Quote = {
          ...data,
          id,
          code: getNextQuoteCode(get().quotes, eventType?.series),
          createdAt: new Date().toISOString(),
        }
        set((s) => ({ quotes: [quote, ...s.quotes] }))
        return id
      },

      updateQuote: (id, patch) =>
        set((s) => ({
          quotes: s.quotes.map((q) => (q.id === id ? { ...q, ...patch } : q)),
        })),

      deleteQuote: (id) =>
        set((s) => ({ quotes: s.quotes.filter((q) => q.id !== id) })),

      addEventType: ({ name, series }) => {
        const id = uid()
        const eventType: EventType = {
          id,
          name: name.trim(),
          series: series && series.trim() ? series.trim().toUpperCase() : "",
          isActive: true,
          createdAt: new Date().toISOString(),
        }
        set((s) => ({ eventTypes: [...s.eventTypes, eventType] }))
        return id
      },

      updateEventType: (id, patch) =>
        set((s) => ({
          eventTypes: s.eventTypes.map((e) => (e.id === id ? { ...e, ...patch } : e)),
        })),

      toggleEventType: (id) =>
        set((s) => ({
          eventTypes: s.eventTypes.map((e) =>
            e.id === id ? { ...e, isActive: !e.isActive } : e,
          ),
        })),

      deleteEventType: (id) =>
        set((s) => ({
          eventTypes: s.eventTypes.filter((e) => e.id !== id),
          products: s.products.map((p) => {
            if (!p.priceByEventType || !(id in p.priceByEventType)) return p
            const copy = { ...p.priceByEventType }
            delete copy[id]
            return { ...p, priceByEventType: copy }
          }),
        })),

      replaceAll: (data) =>
        set(() => ({
          clients: data.clients ?? [],
          projects: data.projects ?? [],
          payments: data.payments ?? [],
          eventTypes: data.eventTypes ?? [],
          settings: normalizeSettings(data.settings),
          products: normalizeProducts(data.products),
          quotes: normalizeQuotes(data.quotes),
        })),

      appendAll: (data) =>
        set((s) => ({
          clients: [...s.clients, ...(data.clients ?? [])],
          projects: [...s.projects, ...(data.projects ?? [])],
          payments: [...s.payments, ...(data.payments ?? [])],
          eventTypes: [...s.eventTypes, ...(data.eventTypes ?? [])],
          settings: {
            ...normalizeSettings(s.settings),
            messages: { ...s.settings.messages, ...(data.settings?.messages ?? {}) },
          },
          products: [...s.products, ...normalizeProducts(data.products)],
          quotes: [...s.quotes, ...normalizeQuotes(data.quotes)],
        })),

      reset: () =>
        set({
          clients: [],
          projects: [],
          payments: [],
          eventTypes: [],
          settings: {
            messages: { ...DEFAULT_MESSAGES },
            quoteFormat: { ...DEFAULT_QUOTE_FORMAT },
          },
          products: [],
          quotes: [],
        }),
    }),
    {
      name: APP_STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      version: 4,
      migrate: (persistedState, version) => {
        if (version < 4) return emptyAppData()
        return persistedState as AppData
      },
    },
  ),
)