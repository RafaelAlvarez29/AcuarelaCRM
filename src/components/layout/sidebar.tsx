import {
  CalendarHeart,
  ChevronDown,
  Columns3,
  Database,
  FileText,
  Folder,
  FolderKanban,
  LayoutDashboard,
  Moon,
  Package,
  Plus,
  Settings,
  SlidersHorizontal,
  Store,
  Sun,
  Users,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { useEffect, useState } from "react"
import { NavLink, useLocation, useNavigate } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"

const THEME_STORAGE_KEY = "acuarela-theme"

interface SubItem {
  to: string
  label: string
  icon: LucideIcon
}

interface NavGroup {
  key: string
  label: string
  icon: LucideIcon
  items: SubItem[]
}

const NAV_ITEMS: SubItem[] = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
]

const NAV_GROUPS: NavGroup[] = [
  {
    key: "proyectos",
    label: "Proyectos",
    icon: FolderKanban,
    items: [
      { to: "/proyectos", label: "Todos los Proyectos", icon: Folder },
      { to: "/tablero", label: "Tablero", icon: Columns3 },
    ],
  },
  {
    key: "ventas",
    label: "Ventas",
    icon: Store,
    items: [
      { to: "/clientes", label: "Clientes", icon: Users },
      { to: "/productos", label: "Productos y Servicios", icon: Package },
      { to: "/tipos-evento", label: "Tipos de Evento", icon: CalendarHeart },
      { to: "/cotizaciones", label: "Cotizaciones", icon: FileText },
    ],
  },
  {
    key: "sistema",
    label: "Sistema",
    icon: Settings,
    items: [
      { to: "/ajustes", label: "Ajustes", icon: SlidersHorizontal },
      { to: "/datos", label: "Datos", icon: Database },
      { to: "__theme__", label: "Modo Oscuro", icon: Moon },
    ],
  },
]

interface SidebarContentProps {
  onNavigate?: () => void
}

function groupOf(pathname: string, group: NavGroup): boolean {
  return group.items.some((item) => item.to === "/" ? pathname === "/" : pathname.startsWith(item.to))
}

export function SidebarContent({ onNavigate }: SidebarContentProps) {
  const navigate = useNavigate()
  const { pathname } = useLocation()

  const [openGroups, setOpenGroups] = useState<string[]>(["proyectos"])
  const [isDark, setIsDark] = useState(() => localStorage.getItem(THEME_STORAGE_KEY) === "dark")

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark)
    localStorage.setItem(THEME_STORAGE_KEY, isDark ? "dark" : "light")
  }, [isDark])

  const toggleTheme = () => setIsDark((prev) => !prev)

  const toggleGroup = (key: string) => {
    setOpenGroups((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]))
  }

  const handleNewProject = () => navigate("/proyectos/nuevo")

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 px-4 pb-6 pt-4 border-b border-border">
        <img
          src="/icon/LOGO ACUARELA 2.svg"
          alt="Logo Acuarela"
          className="h-[72px] w-[72px] rounded-xl object-contain"
        />
        <div className="leading-tight">
          <p className="font-bold text-foreground">Acuarela</p>
          <p className="text-xs text-muted-foreground">Papelería Creativa</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )
            }
          >
            <Icon className="size-4.5 shrink-0" aria-hidden />
            {label}
          </NavLink>
        ))}

        {NAV_GROUPS.map((group) => {
          const isOpen = openGroups.includes(group.key)
          const isActive = groupOf(pathname, group)
          const Icon = group.icon
          return (
            <div key={group.key}>
              <button
                type="button"
                onClick={() => toggleGroup(group.key)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
                aria-expanded={isOpen}
              >
                <Icon className="size-4.5 shrink-0" aria-hidden />
                <span className="flex-1 text-left">{group.label}</span>
                <ChevronDown
                  className={cn("size-4 text-muted-foreground/70 transition-transform", isOpen && "rotate-180")}
                  aria-hidden
                />
              </button>
              {isOpen && (
                <ul className="relative ml-3 mt-1 space-y-1 pl-4 before:absolute before:left-0 before:top-0 before:bottom-0 before:w-px before:bg-border">
                  {group.items.map((item) => {
                        if (item.to === "__theme__") {
                          const ThemeIcon = isDark ? Sun : Moon
                          return (
                            <li key="__theme__">
                              <button
                                type="button"
                                onClick={toggleTheme}
                                className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                              >
                                <ThemeIcon className="size-4.5 shrink-0" aria-hidden />
                                {item.label}
                                <Switch checked={isDark} className="pointer-events-none ml-auto" />
                              </button>
                            </li>
                          )
                        }
                        const ItemIcon = item.icon
                        return (
                          <li key={item.to}>
                            <NavLink
                              to={item.to}
                              onClick={onNavigate}
                              className={({ isActive }) =>
                                cn(
                                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                                  isActive
                                    ? "bg-primary/10 text-primary"
                                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                                )
                              }
                            >
                              <ItemIcon className="size-4.5 shrink-0" aria-hidden />
                              {item.label}
                            </NavLink>
                          </li>
                        )
                      })}
                </ul>
              )}
            </div>
          )
        })}
      </nav>

      <div className="border-t border-border p-3">
        <Button className="w-full" onClick={handleNewProject}>
          <Plus aria-hidden /> Nuevo Proyecto
        </Button>
      </div>
    </div>
  )
}