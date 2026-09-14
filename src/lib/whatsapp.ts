import { formatCurrency } from "@/lib/utils"
import type { Client, Project, Settings } from "@/lib/types"

/**
 * Genera el enlace de WhatsApp con el mensaje configurado para el estado
 * del proyecto (o un saludo genérico si no hay proyecto).
 */
export function generateWhatsAppLink(
  client: Client,
  settings: Settings,
  project?: Project | null,
  balance = 0,
): string {
  const status = project ? project.status : null
  const messageTemplate = status
    ? settings.messages[status] ??
      `Hola ${client.name}, te escribo desde Acuarela Design Studio.`
    : "Hola [NOMBRE_CLIENTE], te escribo desde Acuarela Design Studio."

  const formattedBalance = formatCurrency(balance)

  const message = messageTemplate
    .replace("[NOMBRE_CLIENTE]", client.name)
    .replace("[NOMBRE_PROYECTO]", project ? project.name : "tu proyecto")
    .replace("[SALDO_PENDIENTE]", formattedBalance)

  const number = client.whatsapp_number.replace(/[^0-9]/g, "")
  const safeNumber = number.length >= 10 ? number : "5215512345678"
  const encodedMessage = encodeURIComponent(message)
  return `https://wa.me/${safeNumber}?text=${encodedMessage}`
}