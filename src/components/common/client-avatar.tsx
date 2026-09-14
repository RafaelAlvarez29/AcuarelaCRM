import { cn, getInitial } from "@/lib/utils"
import { getPaletteColor } from "@/lib/constants"

type Size = "sm" | "md" | "lg" | "xl"

const SIZE_CLASSES: Record<Size, { box: string; text: string }> = {
  sm: { box: "size-8", text: "text-sm" },
  md: { box: "size-10", text: "text-base" },
  lg: { box: "size-14", text: "text-xl" },
  xl: { box: "size-24", text: "text-3xl" },
}

interface ClientAvatarProps {
  name: string
  photoBase64?: string | null
  size?: Size
  className?: string
}

/** Avatar del cliente: muestra su foto o la inicial con color pastel de la paleta. */
export function ClientAvatar({ name, photoBase64, size = "md", className }: ClientAvatarProps) {
  const styles = SIZE_CLASSES[size]
  const initial = getInitial(name)
  const color = getPaletteColor()

  if (photoBase64) {
    return (
      <div className={cn("overflow-hidden rounded-full border border-border/70", styles.box, className)}>
        <img src={photoBase64} alt={`Avatar de ${name}`} className="size-full object-cover" />
      </div>
    )
  }

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full font-bold text-white shadow-sm",
        styles.box,
        styles.text,
        className,
      )}
      style={{ backgroundColor: color }}
      aria-label={`Avatar de ${name}`}
    >
      {initial}
    </div>
  )
}