import { AlertCircle, ArrowRight, CalendarClock, Plus, TrendingUp, Wallet } from "lucide-react"
import { useMemo, useState } from "react"
import { Link, useNavigate } from "react-router-dom"

import { EmptyState } from "@/components/common/empty-state"
import { PageHeader } from "@/components/common/page-header"
import { ProjectCard } from "@/components/common/project-card"
import { StatCard } from "@/components/common/stat-card"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { calculateProjectBalance, isProjectActive, isProjectPaid } from "@/lib/calc"
import { cn, formatCurrency, formatDate, newProjectPath } from "@/lib/utils"
import { useAppStore } from "@/stores/useAppStore"
import type { ProjectWithBalance } from "@/lib/types"

type DashboardProject = ProjectWithBalance & {
  client: { id: string; name: string } | undefined
  clientName: string
}

export default function Dashboard() {
  const clients = useAppStore((s) => s.clients)
  const projects = useAppStore((s) => s.projects)
  const payments = useAppStore((s) => s.payments)
  const navigate = useNavigate()
  const [chartDim, setChartDim] = useState<"client" | "project">("client")
  const [chartPeriod, setChartPeriod] = useState<"month" | "week">("month")

  const monthly = useMemo(() => {
    const months: { key: string; label: string; total: number }[] = []
    const now = new Date()
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      months.push({ key: `${d.getFullYear()}-${d.getMonth()}`, label: d.toLocaleDateString("es-MX", { month: "short" }), total: 0 })
    }
    for (const payment of payments) {
      const d = new Date(payment.date)
      if (Number.isNaN(d.getTime())) continue
      const bucket = months.find((m) => m.key === `${d.getFullYear()}-${d.getMonth()}`)
      if (bucket) bucket.total += Number(payment.amount) || 0
    }
    return months
  }, [payments])

  const monthlyTotal = monthly.reduce((sum, m) => sum + m.total, 0)
  const monthlyMax = Math.max(1, ...monthly.map((m) => m.total))

  const weekly = useMemo(() => {
    const weeks: { key: string; label: string; total: number }[] = []
    const now = new Date()
    const currentMonday = new Date(now)
    currentMonday.setDate(currentMonday.getDate() - ((currentMonday.getDay() + 6) % 7))
    for (let i = 11; i >= 0; i--) {
      const start = new Date(currentMonday)
      start.setDate(start.getDate() - i * 7)
      weeks.push({
        key: `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, "0")}-${String(
          start.getDate(),
        ).padStart(2, "0")}`,
        label: start.toLocaleDateString("es-MX", { day: "numeric", month: "numeric" }),
        total: 0,
      })
    }
    for (const payment of payments) {
      const d = new Date(payment.date)
      if (Number.isNaN(d.getTime())) continue
      const start = new Date(d)
      start.setDate(start.getDate() - ((start.getDay() + 6) % 7))
      const key = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, "0")}-${String(
        start.getDate(),
      ).padStart(2, "0")}`
      const bucket = weeks.find((w) => w.key === key)
      if (bucket) bucket.total += Number(payment.amount) || 0
    }
    return weeks
  }, [payments])

  const weeklyTotal = weekly.reduce((sum, w) => sum + w.total, 0)
  const weeklyMax = Math.max(1, ...weekly.map((w) => w.total))

  const earnings = chartPeriod === "month" ? monthly : weekly
  const earningsMax = chartPeriod === "month" ? monthlyMax : weeklyMax
  const earningsTotal = chartPeriod === "month" ? monthlyTotal : weeklyTotal

  const byDimension = useMemo(() => {
    const totals = new Map<string, number>()
    const names = new Map<string, string>()
    for (const payment of payments) {
      const project = projects.find((p) => p.id === payment.projectId)
      let key: string
      let name: string
      if (chartDim === "client") {
        const client = project ? clients.find((c) => c.id === project.clientId) : undefined
        key = client?.id ?? "sin-cliente"
        name = client?.name ?? "Cliente eliminado"
      } else {
        key = project?.id ?? "sin-proyecto"
        name = project?.name ?? "Sin proyecto"
      }
      totals.set(key, (totals.get(key) ?? 0) + (Number(payment.amount) || 0))
      names.set(key, name)
    }
    return Array.from(totals.entries())
      .map(([key, total]) => ({ key, label: names.get(key) ?? key, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 8)
  }, [payments, projects, clients, chartDim])

  const dimensionMax = Math.max(1, ...byDimension.map((d) => d.total))

  const data = useMemo(() => {
    const allProjects: DashboardProject[] = projects
      .map((p) => {
        const balance = calculateProjectBalance(p, payments)
        const client = clients.find((c) => c.id === p.clientId)
        return {
          ...p,
          ...balance,
          client,
          clientName: client?.name ?? "Cliente eliminado",
        } as DashboardProject
      })
      .filter((p) => p.client)

    const activeProjects = allProjects.filter((p) => isProjectActive(p.status))
    const pastProjects = allProjects.filter((p) => !isProjectActive(p.status))

    const totalIncome = allProjects.reduce((sum, p) => sum + p.totalPaid, 0)
    const pendingPaymentProjects = activeProjects.filter((p) => !isProjectPaid(p, p.balance))
    const totalPendingIncome = pendingPaymentProjects.reduce((sum, p) => sum + p.balance, 0)

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const upcomingDeadlines = activeProjects
      .filter((p) => p.deliveryDate && new Date(p.deliveryDate) > today)
      .sort((a, b) => new Date(a.deliveryDate!).getTime() - new Date(b.deliveryDate!).getTime())
      .slice(0, 5)
    const imminentDeadlines = upcomingDeadlines.filter(
      (p) => new Date(p.deliveryDate!) <= tomorrow,
    )

    return {
      allProjects,
      activeProjects,
      pastProjects,
      totalIncome,
      pendingPaymentProjects,
      totalPendingIncome,
      upcomingDeadlines,
      imminentDeadlines,
    }
  }, [projects, clients, payments])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Resumen de tus finanzas y trabajos activos."
      />

      {data.allProjects.length > 0 ? (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatCard
              title="Ingreso Total"
              value={formatCurrency(data.totalIncome)}
              background="/img/azul-acuarela.png"
            />
            <StatCard
              title="Pagos Pendientes"
              value={data.pendingPaymentProjects.length}
              subvalue={formatCurrency(data.totalPendingIncome)}
              background="/img/melon-acuarela.png"
            />
            <StatCard
              title="Próximas Entregas"
              value={data.upcomingDeadlines.length}
              background="/img/verde-acuarela.png"
            />
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex flex-wrap items-center gap-2 text-emerald-600 dark:text-emerald-400">
                  <TrendingUp className="size-4.5" aria-hidden />
                  Ganancias por {chartPeriod === "month" ? "Mes" : "Semana"}
                  <span className="ml-auto inline-flex items-center gap-2">
                    <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                      {formatCurrency(earningsTotal)}
                    </span>
                    <span className="inline-flex rounded-lg bg-muted p-0.5">
                      <button
                        type="button"
                        onClick={() => setChartPeriod("month")}
                        className={cn(
                          "rounded-md px-3 py-1 text-xs font-semibold transition-colors",
                          chartPeriod === "month"
                            ? "bg-emerald-600 text-white shadow-sm"
                            : "text-muted-foreground hover:text-foreground",
                        )}
                      >
                        Mes
                      </button>
                      <button
                        type="button"
                        onClick={() => setChartPeriod("week")}
                        className={cn(
                          "rounded-md px-3 py-1 text-xs font-semibold transition-colors",
                          chartPeriod === "week"
                            ? "bg-emerald-600 text-white shadow-sm"
                            : "text-muted-foreground hover:text-foreground",
                        )}
                      >
                        Semana
                      </button>
                    </span>
                  </span>
                </CardTitle>
                <CardDescription>
                  {chartPeriod === "month"
                    ? "Abonos recibidos en los últimos 12 meses."
                    : "Abonos recibidos en las últimas 12 semanas."}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {payments.length > 0 ? (
                  <div className="flex h-44 items-end gap-1.5">
                    {earnings.map((m) => (
                      <div
                        key={m.key}
                        className="flex h-full flex-1 flex-col items-center justify-end gap-1"
                        title={`${m.label}: ${formatCurrency(m.total)}`}
                      >
                        <span className="text-[9px] font-semibold text-foreground">
                          {m.total > 0 ? formatCurrency(m.total) : ""}
                        </span>
                        <div
                          className={cn("w-full rounded-t-md", m.total > 0 ? "bg-emerald-400" : "bg-muted")}
                          style={{
                            height: `${Math.max(2, (m.total / earningsMax) * 100)}%`,
                          }}
                        />
                        <span className="text-[9px] capitalize text-muted-foreground">
                          {m.label}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="italic text-muted-foreground">
                    Aún no hay pagos registrados para graficar.
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sky-600 dark:text-sky-400">
                  <Wallet className="size-4.5" aria-hidden />
                  Ganancias por selección
                  <span className="ml-auto w-40">
                    <Select value={chartDim} onValueChange={(v) => setChartDim(v as "client" | "project")}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="client">Por cliente</SelectItem>
                        <SelectItem value="project">Por proyecto</SelectItem>
                      </SelectContent>
                    </Select>
                  </span>
                </CardTitle>
                <CardDescription>
                  Abonos agrupados, los 8 mayores.{chartDim === "client" ? " Por cliente." : " Por proyecto."}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {byDimension.length > 0 ? (
                  <div className="space-y-3">
                    {byDimension.map((entry) => (
                      <div key={entry.key}>
                        <div className="flex items-center justify-between gap-3 text-sm">
                          <span className="truncate font-medium text-foreground">{entry.label}</span>
                          <span className="shrink-0 font-semibold text-foreground">
                            {formatCurrency(entry.total)}
                          </span>
                        </div>
                        <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-sky-400 to-sky-600"
                            style={{ width: `${(entry.total / dimensionMax) * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="italic text-muted-foreground">
                    Aún no hay pagos registrados para graficar.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-destructive">
                  <AlertCircle className="size-4.5" aria-hidden />
                  Trabajos con Pagos Pendientes
                  <span className="ml-auto rounded-full bg-destructive/10 px-2.5 py-0.5 text-xs font-bold text-destructive">
                    {data.pendingPaymentProjects.length}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {data.pendingPaymentProjects.length > 0 ? (
                  <ul className="divide-y divide-border rounded-lg">
                    {data.pendingPaymentProjects.map((p) => (
                      <li key={p.id}>
                        <Link
                          to={`/proyectos/${p.id}`}
                          className="flex items-center justify-between gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-destructive/5"
                        >
                          <span className="text-sm font-medium text-foreground">
                            {p.name} ({p.clientName})
                          </span>
                          <span className="font-semibold text-destructive">
                            {formatCurrency(p.balance)}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="italic text-muted-foreground">¡Todo al día! No hay pagos pendientes.</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sky-600 dark:text-sky-400">
                  <CalendarClock className="size-4.5" aria-hidden />
                  Próximas Fechas de Entrega
                  <span className="ml-auto rounded-full bg-sky-100 px-2.5 py-0.5 text-xs font-bold text-sky-700 dark:bg-sky-950 dark:text-sky-300">
                    {data.upcomingDeadlines.length}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {data.upcomingDeadlines.length > 0 ? (
                  <ul className="divide-y divide-border rounded-lg">
                    {data.upcomingDeadlines.map((p) => (
                      <li key={p.id}>
                        <Link
                          to={`/proyectos/${p.id}`}
                          className="flex items-center justify-between gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-sky-50 dark:hover:bg-muted"
                        >
                          <span className="flex items-center gap-2 text-sm font-medium text-foreground">
                            {p.name} ({p.clientName})
                            {data.imminentDeadlines.includes(p) && (
                              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[0.65rem] font-bold text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                                Hoy / Mañana
                              </span>
                            )}
                          </span>
                          <span className="text-sm font-semibold text-sky-600 dark:text-sky-400">
                            {formatDate(p.deliveryDate)}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="italic text-muted-foreground">No hay entregas urgentes a la vista.</p>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Trabajos Activos
                <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary">
                  {data.activeProjects.length}
                </span>
              </CardTitle>
              <CardDescription>Proyectos en curso y con pagos pendientes.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.activeProjects.slice(0, 6).map((p) => (
                <ProjectCard key={p.id} project={p} clientName={p.clientName} />
              ))}
              {data.activeProjects.length === 0 && (
                <p className="py-4 text-center text-muted-foreground">No hay proyectos activos.</p>
              )}
              {data.activeProjects.length > 6 && (
                <Link
                  to="/proyectos"
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
                >
                  Ver todos los proyectos <ArrowRight className="size-4" aria-hidden />
                </Link>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Trabajos Anteriores
                <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary">
                  {data.pastProjects.length}
                </span>
              </CardTitle>
              <CardDescription>Proyectos finalizados o cancelados.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.pastProjects.slice(0, 6).map((p) => (
                <ProjectCard key={p.id} project={p} clientName={p.clientName} />
              ))}
              {data.pastProjects.length === 0 && (
                <p className="py-4 text-center text-muted-foreground">
                  No hay proyectos finalizados o cancelados.
                </p>
              )}
              {data.pastProjects.length > 6 && (
                <Link
                  to="/proyectos"
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
                >
                  Ver todos los proyectos <ArrowRight className="size-4" aria-hidden />
                </Link>
              )}
            </CardContent>
          </Card>
        </>
      ) : (
        <EmptyState
          icon={AlertCircle}
          title="¡Bienvenida a Acuarela CRM!"
          description="Tu panel está listo. Comienza creando tu primer cliente y proyecto para ver el resumen de tus finanzas y trabajos."
          action={{
            label: "Añadir primer cliente o proyecto",
            icon: Plus,
            onClick: () => navigate(newProjectPath(clients.length)),
          }}
        />
      )}

      <div className="flex justify-end">
        <Link
          to="/cotizaciones/nueva"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
        >
          Crear una cotización <ArrowRight className="size-4" aria-hidden />
        </Link>
      </div>
    </div>
  )
}