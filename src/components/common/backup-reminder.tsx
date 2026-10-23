import { AlertTriangle, X } from "lucide-react"
import { useEffect, useState } from "react"
import { Link } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { BACKUP_EXPORTED_EVENT, BACKUP_REMINDER_DAYS, getLastBackupDate } from "@/lib/backup"
import { useAppStore } from "@/stores/useAppStore"

const DAY_MS = 24 * 60 * 60 * 1000

function daysSinceLastBackup(): number | null {
  const lastBackup = getLastBackupDate()
  return lastBackup ? Math.floor((Date.now() - lastBackup.getTime()) / DAY_MS) : null
}

/**
 * Los datos viven solo en este navegador: si se borran los datos de navegación
 * o se cambia de equipo, sin respaldo se pierde todo. Este aviso aparece cuando
 * hay información y el último respaldo exportado es antiguo (o no existe).
 */
export function BackupReminder() {
  const hasData = useAppStore((s) => s.clients.length > 0 || s.quotes.length > 0 || s.products.length > 0)
  const [dismissed, setDismissed] = useState(false)
  const [daysSince, setDaysSince] = useState(daysSinceLastBackup)

  // Se recalcula cuando se exporta un respaldo (ver downloadBackup).
  useEffect(() => {
    const refresh = () => setDaysSince(daysSinceLastBackup())
    window.addEventListener(BACKUP_EXPORTED_EVENT, refresh)
    return () => window.removeEventListener(BACKUP_EXPORTED_EVENT, refresh)
  }, [])

  if (!hasData || dismissed) return null
  if (daysSince !== null && daysSince < BACKUP_REMINDER_DAYS) return null

  return (
    <div
      role="status"
      className="mb-6 flex flex-wrap items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-300"
    >
      <AlertTriangle className="size-4 shrink-0" aria-hidden />
      <p className="flex-1">
        {daysSince === null
          ? "Aún no has exportado un respaldo. Tus datos solo existen en este navegador."
          : `Tu último respaldo fue hace ${daysSince} días. Tus datos solo existen en este navegador.`}
      </p>
      <Button asChild size="sm" variant="outline" className="border-amber-300 bg-transparent">
        <Link to="/datos">Exportar respaldo</Link>
      </Button>
      <Button
        size="icon"
        variant="ghost"
        className="size-7"
        onClick={() => setDismissed(true)}
        aria-label="Ocultar aviso"
      >
        <X className="size-4" aria-hidden />
      </Button>
    </div>
  )
}
