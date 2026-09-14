import { ArrowLeft } from "lucide-react"

import { Button } from "@/components/ui/button"

interface BackButtonProps {
  label?: string
  onClick: () => void
  className?: string
}

export function BackButton({ label = "Volver", onClick, className }: BackButtonProps) {
  return (
    <Button variant="ghost" size="sm" className={className ?? "-ml-2 text-muted-foreground"} onClick={onClick}>
      <ArrowLeft className="size-4" aria-hidden /> {label}
    </Button>
  )
}