import { Search } from "lucide-react"
import { useState, type ReactNode } from "react"

import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

interface SearchComboboxProps<T> {
  query: string
  onQueryChange: (value: string) => void
  items: T[]
  getKey: (item: T) => string
  renderItem: (item: T, selected: boolean) => ReactNode
  onSelect: (item: T) => void
  placeholder: string
  ariaLabel: string
  createLabel?: string
  createIcon?: ReactNode
  onCreate?: () => void
  noData?: boolean
  emptyText?: string
  noResultsText?: string
  className?: string
}

export function SearchCombobox<T>({
  query,
  onQueryChange,
  items,
  getKey,
  renderItem,
  onSelect,
  placeholder,
  ariaLabel,
  createLabel,
  createIcon,
  onCreate,
  noData = false,
  emptyText = "Sin resultados.",
  noResultsText = "Sin coincidencias…",
  className,
}: SearchComboboxProps<T>) {
  const [open, setOpen] = useState(false)
  const [index, setIndex] = useState(0)

  const close = () => {
    setOpen(false)
    setIndex(0)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault()
      if (!open) {
        setOpen(true)
        setIndex(0)
        return
      }
      setIndex((i) => Math.min(i + 1, items.length))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      if (open) setIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === "Enter") {
      e.preventDefault()
      if (!open) {
        setOpen(true)
        return
      }
      if (index === 0) {
        if (onCreate) {
          close()
          onCreate()
        }
        return
      }
      const item = items[index - 1]
      if (item) {
        close()
        onSelect(item)
      }
    } else if (e.key === "Escape") {
      if (open) {
        e.preventDefault()
        close()
      }
    }
  }

  return (
    <div className={cn("relative", className)}>
      <Search
        className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden
      />
      <Input
        value={query}
        onChange={(e) => {
          onQueryChange(e.target.value)
          setIndex(0)
          setOpen(true)
        }}
        onFocus={() => {
          setOpen(true)
          setIndex(0)
        }}
        onBlur={() => window.setTimeout(close, 120)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="pl-9"
        aria-label={ariaLabel}
      />
      {open && (
        <div
          className="absolute z-20 mt-1 max-h-64 w-full overflow-y-auto rounded-lg border bg-popover p-1 shadow-lg"
          role="listbox"
        >
          {onCreate && createLabel && (
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault()
                close()
                onCreate()
              }}
              className={cn(
                "flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-medium text-primary",
                index === 0 ? "bg-primary/10" : "hover:bg-primary/10",
              )}
              role="option"
              aria-selected={index === 0}
            >
              {createIcon}
              {createLabel}
            </button>
          )}
          {items.length === 0 ? (
            <p className="px-3 py-2 text-sm text-muted-foreground">
              {noData ? emptyText : noResultsText}
            </p>
          ) : (
            items.map((item, idx) => {
              const selected = index === idx + 1
              return (
                <button
                  key={getKey(item)}
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault()
                    close()
                    onSelect(item)
                  }}
                  ref={(el) => {
                    if (selected && el) el.scrollIntoView({ block: "nearest" })
                  }}
                  className={cn(
                    "flex w-full items-center justify-between gap-2 rounded-md px-3 py-2 text-left text-sm",
                    selected ? "bg-primary/10" : "hover:bg-primary/10",
                  )}
                  role="option"
                  aria-selected={selected}
                >
                  {renderItem(item, selected)}
                </button>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}