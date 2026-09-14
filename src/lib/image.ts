const MAX_SIZE = 800

/**
 * Redimensiona una imagen a un máximo de 800x800 (manteniendo proporciones)
 * y la convierte a Base64 (JPEG 80%). Devuelve null si ocurre un error.
 */
export function resizeImageAndConvertToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      const result = e.target?.result
      if (typeof result !== "string") {
        reject(new Error("No se pudo leer el archivo."))
        return
      }
      const img = new Image()
      img.onload = () => {
        let width = img.width
        let height = img.height

        if (width > height) {
          if (width > MAX_SIZE) {
            height *= MAX_SIZE / width
            width = MAX_SIZE
          }
        } else if (height > MAX_SIZE) {
          width *= MAX_SIZE / height
          height = MAX_SIZE
        }

        const canvas = document.createElement("canvas")
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext("2d")
        if (!ctx) {
          reject(new Error("Tu navegador no soporta Canvas."))
          return
        }
        ctx.drawImage(img, 0, 0, width, height)
        resolve(canvas.toDataURL("image/jpeg", 0.8))
      }
      img.onerror = () => reject(new Error("Imagen inválida."))
      img.src = result
    }

    reader.onerror = () => reject(new Error("No se pudo leer el archivo."))
    reader.readAsDataURL(file)
  })
}

/** Lee un archivo de imagen (dado por un input) y devuelve el base64 o null. */
export async function fileToResizedBase64(file?: File): Promise<string | null> {
  if (!file) return null
  try {
    return await resizeImageAndConvertToBase64(file)
  } catch {
    return null
  }
}