import { MessageCircle } from "lucide-react"
import type { ComponentProps } from "react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface WhatsAppButtonProps extends ComponentProps<typeof Button> {
  label?: string
}

export function WhatsAppButton({ label = "Iniciar Chat", className, children, ...props }: WhatsAppButtonProps) {
  return (
    <Button
      variant="outline"
      className={cn("border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-800/80 dark:bg-emerald-950 dark:text-emerald-300 dark:hover:bg-emerald-900", className)}
      {...props}
    >
      {children ?? (
        <>
          <MessageCircle aria-hidden /> {label}
        </>
      )}
    </Button>
  )
}