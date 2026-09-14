import type { Payment, Product, Project, Quote, QuoteItem } from "@/lib/types"

export interface ProjectBalance {
  totalPaid: number
  balance: number
}

/** Calcula el total abonado y el saldo pendiente de un proyecto. */
export function calculateProjectBalance(
  project: Pick<Project, "id" | "totalPrice">,
  payments: Payment[],
): ProjectBalance {
  const totalPaid = payments
    .filter((p) => p.projectId === project.id)
    .reduce((sum, payment) => sum + Number(payment.amount || 0), 0)

  const balance = Number(project.totalPrice || 0) - totalPaid
  return {
    totalPaid: Number(totalPaid.toFixed(2)),
    balance: Number(balance.toFixed(2)),
  }
}

export interface QuoteTotals {
  subtotal: number
  discount: number
  taxable: number
  tax: number
  total: number
}

export function quoteSubtotal(items: QuoteItem[]): number {
  return items.reduce((sum, item) => sum + Number(item.quantity || 0) * Number(item.unitPrice || 0), 0)
}

/** Calcula descuento, impuesto y totales de una cotización. */
export function quoteTotals(quote: Pick<Quote, "items" | "discountType" | "discountValue" | "taxRate">): QuoteTotals {
  const subtotal = quoteSubtotal(quote.items)
  const discount =
    quote.discountType === "percent"
      ? subtotal * (Number(quote.discountValue || 0) / 100)
      : Number(quote.discountValue || 0)

  const discountedSubtotal = subtotal - discount
  const tax = discountedSubtotal * (Number(quote.taxRate || 0) / 100)
  const total = discountedSubtotal + tax

  return {
    subtotal: Number(subtotal.toFixed(2)),
    discount: Number(Math.min(discount, subtotal).toFixed(2)),
    taxable: Number(discountedSubtotal.toFixed(2)),
    tax: Number(tax.toFixed(2)),
    total: Number(total.toFixed(2)),
  }
}

export const isProjectActive = (status: string): boolean =>
  status !== "Entregado" && status !== "Cancelado"

/** Un proyecto se considera pagado si se marcó manualmente o su balance es cero. */
export function isProjectPaid(
  project: { isPaid?: boolean | null },
  balance: number,
): boolean {
  return project.isPaid === true || balance <= 0.01
}

/**
 * Precio de un producto. Si se recibe un tipo de evento con precio configurado,
 * usa ese precio; en caso contrario usa el precio base.
 */
export function getProductPrice(
  product: Pick<Product, "price" | "priceByEventType">,
  eventTypeId?: string | null,
): number {
  if (eventTypeId && product.priceByEventType) {
    const eventPrice = Number(product.priceByEventType[eventTypeId])
    if (Number.isFinite(eventPrice)) return eventPrice
  }
  return Number(product.price || 0)
}