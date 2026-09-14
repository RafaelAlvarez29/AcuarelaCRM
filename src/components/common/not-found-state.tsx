import { ArrowLeft } from "lucide-react"

import { Button } from "@/components/ui/button"

interface NotFoundStateProps {
  title: string
  backLabel: string
  onBack: () => void
}

export function NotFoundState({ title, backLabel, onBack }: NotFoundStateProps) {
  return (
    <div className="flex flex-col items-center gap-3 py-20 text-center">
      <p className="text-lg font-semibold text-foreground">{title}</p>
      <Button variant="outline" onClick={onBack}>
        <ArrowLeft aria-hidden /> {backLabel}
      </Button>
    </div>
  )
}