import { CalendarDays, DollarSign } from "lucide-react"
import { Link } from "react-router-dom"

import { Progress } from "@/components/ui/progress"
import type { ProjectWithBalance } from "@/lib/types"
import { formatCurrency, formatDate, getInitial } from "@/lib/utils"
import { getPaletteColor } from "@/lib/constants"
import { isProjectPaid } from "@/lib/calc"
import { ProjectStatusBadge } from "@/components/common/status-badge"
import { cn } from "@/lib/utils"

function projectThumbnailSrc(project: { name: string; thumbnailBase64?: string | null }): string {
  if (project.thumbnailBase64) return project.thumbnailBase64
  const randomHex = getPaletteColor().substring(1)
  const projectInitial = getInitial(project.name)
  return `https://placehold.co/160x160/${randomHex}/333?text=${projectInitial}`
}

interface ProjectCardProps {
  project: ProjectWithBalance
  clientName: string
}

export function ProjectCard({ project, clientName }: ProjectCardProps) {
  const total = Number(project.totalPrice)
  const percentPaid = total > 0 ? Math.min((project.totalPaid / total) * 100, 100) : 100
  const paid = isProjectPaid(project, project.balance)
  const hasBalance = project.balance > 0.01 && !paid

  return (
    <Link
      to={`/proyectos/${project.id}`}
      className="group block rounded-2xl border bg-card p-4 transition-all hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="flex flex-col gap-4 sm:flex-row">
        <img
          src={projectThumbnailSrc(project)}
          alt={`Vista previa de ${project.name}`}
          className="size-20 shrink-0 rounded-xl object-cover sm:size-24"
        />
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="truncate font-bold text-foreground">
              {project.name}
              <span className="font-medium text-muted-foreground"> ({clientName})</span>
            </h3>
            <ProjectStatusBadge status={project.status} />
          </div>
          {project.description && (
            <p className="mb-3 line-clamp-2 text-sm text-muted-foreground">{project.description}</p>
          )}
          <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <CalendarDays className="size-4 text-muted-foreground/70" aria-hidden />
              Entrega:{" "}
              <strong className="font-semibold text-foreground">
                {formatDate(project.deliveryDate)}
              </strong>
            </span>
            <span className={cn("flex items-center gap-1.5", hasBalance ? "text-destructive" : "text-emerald-600 dark:text-emerald-400")}>
              <DollarSign className="size-4 opacity-70" aria-hidden />
              Pago: <strong className="font-semibold">{formatCurrency(project.totalPaid)}</strong>
              <span className="text-muted-foreground">/ {formatCurrency(total)}</span>
            </span>
            {hasBalance ? (
              <span className="font-bold text-destructive">{formatCurrency(project.balance)} pendiente</span>
            ) : (
              <span className="font-bold text-emerald-600 dark:text-emerald-400">Saldo pagado</span>
            )}
          </div>
          <Progress
            className="mt-2 h-1.5"
            value={percentPaid}
            indicatorClassName={hasBalance ? "bg-destructive" : "bg-emerald-500"}
          />
        </div>
      </div>
    </Link>
  )
}