import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"

interface ToggleRowProps {
  title: string
  hint?: string
  checked: boolean
  onChange: (checked: boolean) => void
  className?: string
  switchClassName?: string
  ariaLabel?: string
}

export function ToggleRow({
  title,
  hint,
  checked,
  onChange,
  className,
  switchClassName,
  ariaLabel,
}: ToggleRowProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-4 rounded-lg border bg-muted/40 px-4 py-3",
        className,
      )}
    >
      <div>
        <p className="text-sm font-medium">{title}</p>
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      </div>
      <Switch
        checked={checked}
        onCheckedChange={onChange}
        aria-label={ariaLabel}
        className={switchClassName}
      />
    </div>
  )
}