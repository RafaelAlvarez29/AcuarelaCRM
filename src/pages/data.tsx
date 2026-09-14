import {
  AlertTriangle,
  Download,
  FileJson,
  RefreshCcw,
  Upload,
} from "lucide-react"
import { useRef, useState } from "react"
import { toast } from "sonner"

import { ConfirmDialog } from "@/components/common/confirm-dialog"
import { PageHeader } from "@/components/common/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { downloadBackup, readBackupFile } from "@/lib/backup"
import { useAppStore } from "@/stores/useAppStore"
import type { AppData } from "@/lib/types"

export default function DataView() {
  const store = useAppStore()
  const replaceAll = useAppStore((s) => s.replaceAll)
  const appendAll = useAppStore((s) => s.appendAll)
  const reset = useAppStore((s) => s.reset)

  const [pendingImport, setPendingImport] = useState<AppData | null>(null)
  const [confirmReset, setConfirmReset] = useState(false)
  const [dragging, setDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleExport = () => {
    downloadBackup({
      clients: store.clients,
      projects: store.projects,
      payments: store.payments,
      eventTypes: store.eventTypes,
      settings: store.settings,
      products: store.products,
      quotes: store.quotes,
    })
    toast.success("Datos exportados con éxito.")
  }

  const processFile = async (file?: File) => {
    if (!file) return
    const data = await readBackupFile(file)
    if (!data) {
      toast.error("El archivo seleccionado no es un JSON de respaldo válido.")
      return
    }
    setPendingImport(data)
  }

  const handleReplace = () => {
    if (pendingImport) replaceAll(pendingImport)
    setPendingImport(null)
    toast.success("Datos reemplazados por los del archivo.")
  }

  const handleMerge = () => {
    if (!pendingImport) return
    const current = store
    const imported = pendingImport

    const existingClientIds = new Set(current.clients.map((c) => c.id))
    const existingClientNames = new Set(current.clients.map((c) => c.name.trim().toLowerCase()))
    const clientsToAdd = imported.clients.filter(
      (c) => !existingClientIds.has(c.id) && !existingClientNames.has(c.name.trim().toLowerCase()),
    )
    const skippedClients = imported.clients.length - clientsToAdd.length

    const existingProjectIds = new Set(current.projects.map((p) => p.id))
    const existingProjectNames = new Set(current.projects.map((p) => p.name.trim().toLowerCase()))
    const projectsToAdd = imported.projects.filter(
      (p) => !existingProjectIds.has(p.id) && !existingProjectNames.has(p.name.trim().toLowerCase()),
    )
    const skippedProjects = imported.projects.length - projectsToAdd.length

    const existingPaymentIds = new Set(current.payments.map((p) => p.id))
    const paymentsToAdd = imported.payments.filter((p) => !existingPaymentIds.has(p.id))

    const existingProductIds = new Set(current.products.map((p) => p.id))
    const productsToAdd = imported.products.filter((p) => !existingProductIds.has(p.id))

    const existingEventTypeIds = new Set(current.eventTypes.map((e) => e.id))
    const eventTypesToAdd = imported.eventTypes.filter((e) => !existingEventTypeIds.has(e.id))

    const existingQuoteIds = new Set(current.quotes.map((q) => q.id))
    const quotesToAdd = imported.quotes.filter((q) => !existingQuoteIds.has(q.id))

    appendAll({
      clients: clientsToAdd,
      projects: projectsToAdd,
      payments: paymentsToAdd,
      eventTypes: eventTypesToAdd,
      products: productsToAdd,
      quotes: quotesToAdd,
      settings: imported.settings,
    })

    const skipped = skippedClients + skippedProjects
    setPendingImport(null)
    toast.success(
      `Importación completada. Se añadieron los registros nuevos${
        skipped > 0 ? ` y se omitieron ${skipped} duplicados por nombre.` : "."
      }`,
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Datos"
        description="Copia de seguridad, restauración y mantenimiento de tu información."
      />

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Card className="border-blue-200 bg-blue-50 dark:border-blue-900/60 dark:bg-blue-950/40">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-800 dark:text-blue-300">
              <Download className="size-5" aria-hidden /> Exportar Datos
            </CardTitle>
            <CardDescription className="text-blue-700 dark:text-blue-300/80">
              Guarda una copia de seguridad con clientes, proyectos, pagos, productos, cotizaciones y ajustes.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-sm text-blue-700 dark:text-blue-300/80">
              El archivo se nombrará <strong>DataAcuarelaCRM_[fecha].json</strong>.
            </p>
            <Button className="w-full bg-blue-600 hover:bg-blue-700" onClick={handleExport}>
              <FileJson aria-hidden /> Descargar JSON de Datos
            </Button>
          </CardContent>
        </Card>

        <Card className="border-red-200 bg-red-50 dark:border-red-900/60 dark:bg-red-950/40">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-800 dark:text-red-300">
              <Upload className="size-5" aria-hidden /> Importar Datos
            </CardTitle>
            <CardDescription className="text-red-700 dark:text-red-300/80">
              Restaura un respaldo previo. La importación puede modificar o reemplazar tus datos actuales.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault()
                setDragging(true)
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => {
                e.preventDefault()
                setDragging(false)
                void processFile(e.dataTransfer.files[0])
              }}
              className={`flex w-full flex-col items-center gap-2 rounded-xl border-2 border-dashed p-8 text-center transition-colors ${
                dragging
                  ? "border-red-500 bg-red-100 dark:bg-red-950/50"
                  : "border-red-300 bg-white/50 hover:bg-red-100 dark:border-red-800 dark:bg-transparent dark:hover:bg-red-950/40"
              }`}
            >
              <Upload className="size-8 text-red-400 dark:text-red-400" aria-hidden />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                Arrastra tu archivo JSON aquí o haz clic para seleccionarlo
              </span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              className="hidden"
              onChange={(e) => {
                void processFile(e.target.files?.[0])
                e.currentTarget.value = ""
              }}
            />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="size-5" aria-hidden /> Zona peligrosa
          </CardTitle>
          <CardDescription>
            Restablece la aplicación y elimina todos los datos almacenados.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" className="border-red-200 bg-red-50 text-red-600 hover:bg-red-100 dark:border-red-900 dark:bg-red-950/40 dark:text-red-400 dark:hover:bg-red-950/70" onClick={() => setConfirmReset(true)}>
            <RefreshCcw aria-hidden /> Restablecer todo
          </Button>
        </CardContent>
      </Card>

      <Dialog open={pendingImport !== null} onOpenChange={(open) => !open && setPendingImport(null)}>
        {pendingImport && (
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Modo de Importación</DialogTitle>
              <DialogDescription>
                El archivo contiene <strong>{pendingImport.clients.length} clientes</strong> y{" "}
                <strong>{pendingImport.projects.length} proyectos</strong>. ¿Cómo deseas proceder?
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-300">
              Al fusionar se omitirán duplicados por nombre; al reemplazar se borrará todo el contenido actual.
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => void handleMerge()}>
                Añadir a existentes
              </Button>
              <Button
                className="bg-destructive text-white hover:bg-destructive/90"
                onClick={() => void handleReplace()}
              >
                Reemplazar todo
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>

      <ConfirmDialog
        open={confirmReset}
        onOpenChange={setConfirmReset}
        title="Restablecer todos los datos"
        description={
          <>
            <p>¿Estás segura de eliminar TODA la información?</p>
            <p className="font-semibold text-destructive">
              Esta acción no se puede deshacer. Exporta primero un respaldo si lo necesitas.
            </p>
          </>
        }
        confirmLabel="Sí, restablecer todo"
        destructive
        onConfirm={() => {
          reset()
          toast.success("Se restableció la aplicación.")
        }}
      />
    </div>
  )
}