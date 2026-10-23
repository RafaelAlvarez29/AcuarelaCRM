import { toast } from "sonner"

import { formatCurrency } from "@/lib/utils"
import type { Client, Project, Settings } from "@/lib/types"

/** Código de país que se antepone a los números locales de 10 dígitos. */
const DEFAULT_COUNTRY_CODE = "52"

/**
 * Convierte un teléfono capturado a mano en el formato que espera wa.me
 * (solo dígitos, con código de país). Devuelve null si no es un número válido:
 * nunca se sustituye por otro número, para no enviar datos del cliente a un tercero.
 */
export function normalizeWhatsAppNumber(raw: string | null | undefined): string | null {
  const digits = (raw ?? "").replace(/[^0-9]/g, "")
  if (digits.length === 10) return `${DEFAULT_COUNTRY_CODE}${digits}`
  // Más de 10 dígitos: se asume que ya incluye el código de país (ej. 52, 521, 1).
  if (digits.length >= 11 && digits.length <= 15) return digits
  return null
}

/** Arma el enlace de wa.me o devuelve null si el número no es válido. */
export function buildWhatsAppLink(phone: string | null | undefined, message: string): string | null {
  const number = normalizeWhatsAppNumber(phone)
  if (!number) return null
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`
}

/** Abre el enlace en una pestaña nueva, o avisa si el número del cliente no es válido. */
export function openWhatsAppLink(link: string | null) {
  if (!link) {
    toast.error("El número de WhatsApp no es válido. Corrígelo en la ficha del cliente (10 dígitos o con código de país).")
    return
  }
  window.open(link, "_blank")
}

/**
 * Genera el enlace de WhatsApp con el mensaje configurado para el estado
 * del proyecto (o un saludo genérico si no hay proyecto).
 * Devuelve null si el número del cliente no es válido.
 */
export function generateWhatsAppLink(
  client: Client,
  settings: Settings,
  project?: Project | null,
  balance = 0,
): string | null {
  const status = project ? project.status : null
  const messageTemplate = status
    ? settings.messages[status] ??
      `Hola ${client.name}, te escribo desde Acuarela Design Studio.`
    : "Hola [NOMBRE_CLIENTE], te escribo desde Acuarela Design Studio."

  const formattedBalance = formatCurrency(balance)

  const message = messageTemplate
    .replaceAll("[NOMBRE_CLIENTE]", client.name)
    .replaceAll("[NOMBRE_PROYECTO]", project ? project.name : "tu proyecto")
    .replaceAll("[SALDO_PENDIENTE]", formattedBalance)

  return buildWhatsAppLink(client.whatsapp_number, message)
}
