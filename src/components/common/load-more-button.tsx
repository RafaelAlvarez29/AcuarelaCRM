import { Button } from "@/components/ui/button"

interface LoadMoreButtonProps {
  onClick: () => void
  remaining: number
}

/** Botón para paginar listas con "cargar más". */
export function LoadMoreButton({ onClick, remaining }: LoadMoreButtonProps) {
  return (
    <div className="flex justify-center pt-2">
      <Button variant="outline" onClick={onClick}>
        Ver más ({(remaining).toLocaleString("es-MX")} restantes)
      </Button>
    </div>
  )
}