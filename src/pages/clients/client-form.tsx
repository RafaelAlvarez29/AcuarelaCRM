import { UserPlus } from "lucide-react"
import { useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"

import { BackButton } from "@/components/common/back-button"
import { FormField } from "@/components/common/form-field"
import { ImagePicker } from "@/components/common/image-picker"
import { PageHeader } from "@/components/common/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"

import { useAppStore } from "@/stores/useAppStore"

export default function ClientForm() {
  const addClient = useAppStore((s) => s.addClient)
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const [name, setName] = useState("")
  const [whatsapp, setWhatsapp] = useState("")
  const [email, setEmail] = useState("")
  const [photo, setPhoto] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const continueToProject = searchParams.get("continuar") === "proyecto"

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !whatsapp.trim()) return
    setBusy(true)
    const id = addClient({ name, whatsapp_number: whatsapp, email, photoBase64: photo })
    setBusy(false)
    toast.success(`Cliente "${name.trim()}" creado${continueToProject ? ", continúa con el proyecto." : "."}`)
    if (continueToProject) {
      navigate(`/proyectos/nuevo?cliente=${id}`)
    } else {
      navigate("/clientes")
    }
  }

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <BackButton label="Volver a Clientes" onClick={() => navigate("/clientes")} />

      <PageHeader
        title={continueToProject ? "Paso 1: Crear Nuevo Cliente" : "Crear Nuevo Cliente"}
        description="Completa los datos del cliente para poder asignarle proyectos y cotizaciones."
      />

      <Card>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <FormField label="Nombre del Cliente" htmlFor="client-name" required>
              <Input
                id="client-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nombre y apellido"
                required
                autoFocus
              />
            </FormField>

            <FormField label="Número de WhatsApp" htmlFor="client-whatsapp" required>
              <Input
                id="client-whatsapp"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder="+52 55 1234 5678"
                required
              />
            </FormField>

            <FormField label="Correo Electrónico" htmlFor="client-email">
              <Input
                id="client-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="cliente@correo.com"
              />
            </FormField>

            <FormField label="Fotografía del Cliente">
              <ImagePicker value={photo} onChange={setPhoto} label="Foto del cliente" aspectClass="aspect-[3/1]" />
            </FormField>

            <Button type="submit" className="w-full" disabled={busy}>
              <UserPlus aria-hidden />
              {continueToProject ? "Crear cliente y continuar al proyecto →" : "Crear Cliente"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}