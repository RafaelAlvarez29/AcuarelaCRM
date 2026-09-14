export const PROJECT_STATUSES = [
  "Pendiente de inicio",
  "En proceso",
  "Pendiente de pago",
  "Por entregar",
  "Entregado",
  "Cancelado",
] as const

export type ProjectStatus = (typeof PROJECT_STATUSES)[number]

export const QUOTE_STATUSES = [
  "Borrador",
  "Enviada",
  "Aprobada",
  "Rechazada",
] as const

export type QuoteStatus = (typeof QUOTE_STATUSES)[number]

export interface Client {
  id: string
  name: string
  whatsapp_number: string
  email?: string | null
  photoBase64?: string | null
  creationDate: string
  isActive: boolean
}

export interface Project {
  id: string
  clientId: string
  name: string
  totalPrice: number
  /** Marcado manualmente como pagado (independiente de los abonos registrados). */
  isPaid?: boolean | null
  description: string
  status: ProjectStatus
  deliveryDate?: string | null
  creationDate: string
  lastUpdated?: string
  thumbnailBase64?: string | null
  /** Cotización que dio origen a este proyecto (si existe). */
  sourceQuoteId?: string | null
  /** Orden dentro de su columna en el tablero (menor = primero). */
  order?: number
}

export interface Payment {
  id: string
  projectId: string
  amount: number
  date: string
}

export interface Product {
  id: string
  name: string
  description?: string | null
  /** Precio base del producto. */
  price: number
  /** Precio por cada tipo de evento (id → precio). */
  priceByEventType: Record<string, number>
  category?: string | null
  imageBase64?: string | null
  isActive: boolean
  createdAt: string
}

export interface EventType {
  id: string
  name: string
  series?: string | null
  isActive: boolean
  createdAt: string
}

export type QuoteDiscountType = "percent" | "fixed"

export interface QuoteItem {
  id: string
  productId?: string | null
  name: string
  description?: string | null
  quantity: number
  unitPrice: number
}

export interface Quote {
  id: string
  code: string
  clientId?: string | null
  clientName: string
  clientPhone: string
  clientEmail?: string | null
  eventTypeId?: string | null
  eventTypeName?: string | null
  items: QuoteItem[]
  discountType: QuoteDiscountType
  discountValue: number
  taxRate: number
  deposit?: number | null
  notes?: string | null
  status: QuoteStatus
  createdAt: string
  validUntil?: string | null
}

export interface QuoteFormatSettings {
  businessName: string
  address: string
  phone: string
  mapsUrl: string
  whatsappMessage: string
  validityText: string
  footerText: string
}

export interface Settings {
  messages: Record<string, string>
  quoteFormat: QuoteFormatSettings
}

export interface AppData {
  clients: Client[]
  projects: Project[]
  payments: Payment[]
  eventTypes: EventType[]
  settings: Settings
  products: Product[]
  quotes: Quote[]
}

export interface ProjectWithBalance extends Project {
  totalPaid: number
  balance: number
}

export interface ClientWithSummary extends Client {
  activeCount: number
  totalBalance: number
  totalProjects: number
}