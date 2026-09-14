import { ImagePlus, Trash2 } from "lucide-react"
import { useRef, useState } from "react"

import { Button } from "@/components/ui/button"
import { fileToResizedBase64 } from "@/lib/image"
import { cn } from "@/lib/utils"

interface ImagePickerProps {
  value: string | null | undefined
  onChange: (base64: string | null) => void
  label?: string
  aspectClass?: string
}

/** Selector de imagen con arrastrar/soltar, vista previa y redimensionamiento automático (máx. 800px). */
export function ImagePicker({
  value,
  onChange,
  label = "Imagen",
  aspectClass = "aspect-video",
}: ImagePickerProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [over, setOver] = useState(false)

  const handleFile = async (file?: File) => {
    if (!file) return
    setBusy(true)
    const base64 = await fileToResizedBase64(file)
    setBusy(false)
    if (base64) onChange(base64)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setOver(false)
    void handleFile(e.dataTransfer.files?.[0])
  }

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          handleFile(e.target.files?.[0])
          e.currentTarget.value = ""
        }}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault()
          setOver(true)
        }}
        onDragLeave={() => setOver(false)}
        onDrop={handleDrop}
        className={cn(
          "flex w-full flex-col items-center justify-center overflow-hidden rounded-xl border-2 border-dashed bg-muted/40 text-muted-foreground transition-colors hover:border-primary/50 hover:bg-muted",
          aspectClass,
          busy && "pointer-events-none opacity-60",
          over && "border-primary bg-primary/10",
        )}
      >
        {value ? (
          <img src={value} alt={label} className="size-full object-cover" />
        ) : (
          <span className="flex flex-col items-center gap-1.5 text-sm">
            <ImagePlus className="size-6" aria-hidden />
            {busy ? "Procesando…" : over ? "Suelta para adjuntar" : "Subir imagen"}
          </span>
        )}
      </button>
      {value && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
          onClick={() => onChange(null)}
        >
          <Trash2 aria-hidden /> Quitar imagen
        </Button>
      )}
    </div>
  )
}