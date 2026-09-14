import type { ProjectStatus, QuoteStatus } from "@/lib/types"

/** Clave del nuevo store de la app React */
export const APP_STORAGE_KEY = "acuarela-app-v2"

export const DEFAULT_MESSAGES: Record<ProjectStatus, string> = {
  "Pendiente de inicio":
    'Hola [NOMBRE_CLIENTE], te escribo para confirmar que hemos agendado tu proyecto "[NOMBRE_PROYECTO]". Estaremos en contacto pronto para iniciar. ¡Gracias por confiar en Acuarela!',
  "En proceso":
    'Hola [NOMBRE_CLIENTE], te informo que tu proyecto "[NOMBRE_PROYECTO]" está actualmente en proceso de diseño/elaboración. Te mantendremos al tanto de cualquier avance. Saludos.',
  "Pendiente de pago":
    'Hola [NOMBRE_CLIENTE], tu proyecto "[NOMBRE_PROYECTO]" está finalizado y listo para la entrega. El saldo pendiente es de [SALDO_PENDIENTE]. Una vez recibido el pago, procederemos a enviarte los archivos finales. ¡Gracias!',
  "Por entregar":
    'Hola [NOMBRE_CLIENTE], tu proyecto "[NOMBRE_PROYECTO]" ya está pagado y listo. Por favor, confirma por qué medio deseas la entrega de los archivos finales.',
  Entregado:
    'Hola [NOMBRE_CLIENTE], tu proyecto "[NOMBRE_PROYECTO]" ha sido entregado exitosamente. ¡Muchas gracias por tu preferencia!',
  Cancelado:
    'Hola [NOMBRE_CLIENTE], tu proyecto "[NOMBRE_PROYECTO]" ha sido marcado como cancelado.',
}

export const QUOTE_STATUS_LABELS: Record<QuoteStatus, string> = {
  Borrador: "Borrador",
  Enviada: "Enviada",
  Aprobada: "Aprobada",
  Rechazada: "Rechazada",
}

/** Paleta pastel para avatares e imágenes placeholder */
export const PALETTE_COLORS = [
  "#EBABC3",
  "#9BD9D8",
  "#D2ABEE",
  "#F7C5A2",
  "#FE9FC1",
]

export const getPaletteColor = (): string => {
  const randomIndex = Math.floor(Math.random() * PALETTE_COLORS.length)
  return PALETTE_COLORS[randomIndex]!
}

/** Colores de marca usados en el PDF de cotizaciones */
export const BRAND_COLORS = {
  primary: "#ebacc3",
  primaryDark: "#f59fc2",
  ink: "#1f2937",
  muted: "#6b7280",
  light: "#f3f4f6",
}

export const BUSINESS_NAME = "Acuarela Design Studio"
export const BUSINESS_SLOGAN = "Papelería social · Diseño a tu medida"

/** Datos por defecto del formato de cotización (personalizables en Ajustes). */
export const DEFAULT_QUOTE_FORMAT = {
  businessName: "ACUARELA PAPELERIA SOCIAL",
  address: "GARZA ROMERO 1816, TERRANOVA",
  phone: "668 254 8438",
  mapsUrl: "https://maps.app.goo.gl/UPkfd7vsN8A4sXYr5",
  whatsappMessage: "Hola, les escribo por la cotización. ¿Me podrían dar más información?",
  validityText:
    "ESTA COTIZACIÓN TIENE UNA VALIDEZ DE 30 DÍAS. DESPUÉS DE ESTE TIEMPO DEBERÁ SOLICITAR UNA NUEVA COTIZACIÓN. Y ESTARÁ SUJETA A POSIBLES CAMBIOS DE PRECIOS.",
  footerText:
    "PARA ABONAR A ESTA COTIZACIÓN O PAGAR EL TOTAL DE LA MISMA. REALICE EL PAGO A LA CUENTA 4152 3143 1401 7180 A NOMBRE DE ITZEL YANNIN MEZA LOYA EN BANCO BBVA BANCOMER MÉXICO. PORFAVOR ENVIAR EL COMPROBANTE POR MEDIO DE SU ORGANIZADOR DE EVENTOS O BIEN AL 668 254 8438, TAMBIEN PUEDE ENVIAR NUESTRO CORREO DE CONTACTO yannin.meza96@gmail.com. QUEDAMOS A SUS ORDENES Y SERVICIO. SALUDOS CORDIALES.",
} as const

export type QuoteFormatDefaults = typeof DEFAULT_QUOTE_FORMAT

/** Ruta del logo en assets públicos */
export const LOGO_PATH = "/icon/ACUARELA LOGO3.svg"
export const LOGO_PNG_PATH = "/icon/acuarela-cr.webp"
export const HEADER_BACKGROUND_PATH = "/img/header.png"