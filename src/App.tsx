import { lazy } from "react"
import { HashRouter, Route, Routes } from "react-router-dom"
import { Toaster } from "sonner"

import { AppLayout } from "@/components/layout/app-layout"
import { TooltipProvider } from "@/components/ui/tooltip"
import Dashboard from "@/pages/dashboard"

const Board = lazy(() => import("@/pages/board"))
const ClientList = lazy(() => import("@/pages/clients/client-list"))
const ClientDetail = lazy(() => import("@/pages/clients/client-detail"))
const ClientForm = lazy(() => import("@/pages/clients/client-form"))
const ProjectForm = lazy(() => import("@/pages/projects/project-form"))
const ProjectDetail = lazy(() => import("@/pages/projects/project-detail"))
const ProjectList = lazy(() => import("@/pages/projects/project-list"))
const ProductList = lazy(() => import("@/pages/products/product-list"))
const ProductForm = lazy(() => import("@/pages/products/product-form"))
const EventTypes = lazy(() => import("@/pages/event-types"))
const QuoteList = lazy(() => import("@/pages/quotes/quote-list"))
const QuoteForm = lazy(() => import("@/pages/quotes/quote-form"))
const QuoteDetail = lazy(() => import("@/pages/quotes/quote-detail"))
const Settings = lazy(() => import("@/pages/settings"))
const DataView = lazy(() => import("@/pages/data"))

export default function App() {
  return (
    <TooltipProvider>
      <HashRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="/tablero" element={<Board />} />
            <Route path="/clientes" element={<ClientList />} />
            <Route path="/clientes/nuevo" element={<ClientForm />} />
            <Route path="/clientes/:id" element={<ClientDetail />} />
            <Route path="/proyectos" element={<ProjectList />} />
            <Route path="/proyectos/nuevo" element={<ProjectForm />} />
            <Route path="/proyectos/:id" element={<ProjectDetail />} />
            <Route path="/productos" element={<ProductList />} />
            <Route path="/productos/nuevo" element={<ProductForm />} />
            <Route path="/productos/:id/editar" element={<ProductForm />} />
            <Route path="/tipos-evento" element={<EventTypes />} />
            <Route path="/cotizaciones" element={<QuoteList />} />
            <Route path="/cotizaciones/nueva" element={<QuoteForm />} />
            <Route path="/cotizaciones/:id/editar" element={<QuoteForm />} />
            <Route path="/cotizaciones/:id" element={<QuoteDetail />} />
            <Route path="/ajustes" element={<Settings />} />
            <Route path="/datos" element={<DataView />} />
            <Route path="*" element={<Dashboard />} />
          </Route>
        </Routes>
      </HashRouter>
      <Toaster position="top-right" richColors closeButton />
    </TooltipProvider>
  )
}