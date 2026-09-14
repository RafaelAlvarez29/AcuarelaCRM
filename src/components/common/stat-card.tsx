import type { ReactNode } from "react"

interface StatCardProps {
  title: string
  value: ReactNode
  valueClassName?: string
  background: string
  subvalue?: ReactNode
  onClick?: () => void
}

/** Tarjeta de métrica con fondo acuarela para el dashboard. */
export function StatCard({ title, value, valueClassName, background, subvalue, onClick }: StatCardProps) {
  const Comp = onClick ? "button" : "div"
  return (
    <Comp
      onClick={onClick}
      className="watercolor-card text-slate-800"
      style={{ backgroundImage: `url("${background}")`, backgroundSize: "cover", backgroundPosition: "center" }}
    >
      <p className="wc-title">{title}</p>
      <p className={`wc-value ${valueClassName ?? ""}`}>{value}</p>
      {subvalue && <p className="mt-1 text-sm font-semibold text-gray-600">{subvalue}</p>}
    </Comp>
  )
}