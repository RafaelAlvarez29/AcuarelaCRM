import { Menu } from "lucide-react"
import { useState } from "react"
import { Outlet } from "react-router-dom"

import { SidebarContent } from "@/components/layout/sidebar"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet"

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar de escritorio */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-border bg-card lg:block">
        <SidebarContent />
      </aside>

      {/* Sidebar móvil */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="absolute left-4 top-4 z-30 !ml-4 !mt-4 lg:hidden"
            aria-label="Abrir menú"
          >
            <Menu aria-hidden />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-72 p-0 sm:max-w-xs">
          <SheetTitle className="sr-only">Menú de navegación</SheetTitle>
          <SidebarContent onNavigate={() => setSidebarOpen(false)} />
        </SheetContent>
      </Sheet>

      {/* Contenido principal */}
      <div className="flex min-h-screen flex-col lg:pl-64">
<header
  className="relative flex h-20 items-center justify-center bg-cover bg-center"
  style={{ backgroundImage: 'url("/img/header.png")' }}
>
          <div className="relative z-10 flex items-center gap-3 px-6">
            <img src="/icon/ACUARELA%20LOGO3.svg" alt="" className="h-[46px] w-[230px] object-contain" />
          </div>
        </header>

        <main className="mx-auto w-full max-w-7xl flex-1 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}