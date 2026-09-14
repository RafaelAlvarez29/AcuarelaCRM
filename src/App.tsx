import { HashRouter, Route, Routes } from "react-router-dom"
import { Toaster } from "sonner"

import { AppLayout } from "@/components/layout/app-layout"
import { TooltipProvider } from "@/components/ui/tooltip"
import Dashboard from "@/pages/dashboard"
import Board from "@/pages/board"
import ClientList from "@/pages/clients/client-list"
import ClientDetail from "@/pages/clients/client-detail"
import ClientForm from "@/pages/clients/client-form"
import ProjectForm from "@/pages/projects/project-form"
import ProjectDetail from "@/pages/projects/project-detail"
import ProjectList from "@/pages/projects/project-list"
import ProductList from "@/pages/products/product-list"
import ProductForm from "@/pages/products/product-form"
import EventTypes from "@/pages/event-types"
import QuoteList from "@/pages/quotes/quote-list"
import QuoteForm from "@/pages/quotes/quote-form"
import QuoteDetail from "@/pages/quotes/quote-detail"
import Settings from "@/pages/settings"
import DataView from "@/pages/data"

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