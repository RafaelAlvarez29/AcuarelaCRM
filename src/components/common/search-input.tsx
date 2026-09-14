import { Search, type LucideIcon } from "lucide-react"

import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

interface SearchInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  ariaLabel?: string
  icon?: LucideIcon
  className?: string
}

export function SearchInput({
  value,
  onChange,
  placeholder,
  ariaLabel,
  icon: Icon = Search,
  className,
}: SearchInputProps) {
  return (
    <div className={cn("relative flex-1", className)}>
      <Icon
        className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden
      />
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="pl-9"
        aria-label={ariaLabel}
      />
    </div>
  )
}