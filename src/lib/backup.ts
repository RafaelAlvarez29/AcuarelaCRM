import type { AppData } from "@/lib/types"

/** Descarga el backup completo de los datos como archivo JSON. */
export function downloadBackup(data: AppData) {
  const jsonString = JSON.stringify(data, null, 2)
  const blob = new Blob([jsonString], { type: "application/json" })
  const url = URL.createObjectURL(blob)

  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "")
  const filename = `DataAcuarelaCRM_${date}.json`

  const a = document.createElement("a")
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/** Lee y parsea un archivo JSON de respaldo. Devuelve null si no es válido. */
export function readBackupFile(file: File): Promise<AppData | null> {
  return new Promise((resolve) => {
    if (!file.name.toLowerCase().endsWith(".json") && file.type !== "application/json") {
      resolve(null)
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result ?? ""))
        if (parsed && Array.isArray(parsed.clients) && Array.isArray(parsed.projects)) {
          resolve(parsed as AppData)
        } else {
          resolve(null)
        }
      } catch {
        resolve(null)
      }
    }
    reader.onerror = () => resolve(null)
    reader.readAsText(file)
  })
}