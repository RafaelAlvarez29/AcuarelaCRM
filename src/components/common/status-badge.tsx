import { cn } from "@/lib/utils"
import type { ProjectStatus, QuoteStatus } from "@/lib/types"

const PROJECT_STATUS_STYLES: Record<string, string> = {
  "Pendiente de inicio": "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800/80 dark:bg-blue-950 dark:text-blue-300",
  "En proceso": "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800/80 dark:bg-amber-950 dark:text-amber-300",
  "Pendiente de pago": "border-pink-200 bg-pink-50 text-pink-700 dark:border-pink-800/80 dark:bg-pink-950 dark:text-pink-300",
  "Por entregar": "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-800/80 dark:bg-sky-950 dark:text-sky-300",
  Entregado: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800/80 dark:bg-emerald-950 dark:text-emerald-300",
  Cancelado: "border-gray-200 bg-gray-100 text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300",
}

const FALLBACK_STATUS_STYLE = "border-gray-200 bg-gray-100 text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"

const QUOTE_STATUS_STYLES: Record<QuoteStatus, string> = {
  Borrador: "border-gray-200 bg-gray-100 text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300",
  Enviada: "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800/80 dark:bg-blue-950 dark:text-blue-300",
  Aprobada: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800/80 dark:bg-emerald-950 dark:text-emerald-300",
  Rechazada: "border-red-200 bg-red-50 text-red-600 dark:border-red-800/80 dark:bg-red-950 dark:text-red-300",
}

export function ProjectStatusBadge({ status, className }: { status: ProjectStatus; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold",
        PROJECT_STATUS_STYLES[status] ?? FALLBACK_STATUS_STYLE,
        className,
      )}
    >
      <span className="size-1.5 rounded-full bg-current" aria-hidden />
      {status}
    </span>
  )
}

export function QuoteStatusBadge({ status, className }: { status: QuoteStatus; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold",
        QUOTE_STATUS_STYLES[status],
        className,
      )}
    >
      {status}
    </span>
  )
}