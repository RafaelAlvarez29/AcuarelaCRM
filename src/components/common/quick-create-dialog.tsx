import { Plus } from "lucide-react"
import type { ReactNode } from "react"

import { FormField } from "@/components/common/form-field"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"

export interface QuickCreateField {
  id: string
  label: string
  placeholder?: string
  type?: string
  required?: boolean
  value: string
  onChange: (value: string) => void
}

interface QuickCreateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  icon: ReactNode
  title: string
  description: string
  fields: QuickCreateField[]
  submitLabel: string
  onSubmit: () => void
}

export function QuickCreateDialog({
  open,
  onOpenChange,
  icon,
  title,
  description,
  fields,
  submitLabel,
  onSubmit,
}: QuickCreateDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {icon}
            {title}
          </DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <div className="space-y-4">
          {fields.map((field, idx) => (
            <FormField key={field.id} label={field.label} htmlFor={field.id} required={field.required}>
              <Input
                id={field.id}
                type={field.type ?? "text"}
                value={field.value}
                onChange={(e) => field.onChange(e.target.value)}
                placeholder={field.placeholder}
                autoFocus={idx === 0}
                onKeyDown={(e) => e.key === "Enter" && onSubmit()}
              />
            </FormField>
          ))}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={onSubmit}>
            <Plus aria-hidden /> {submitLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}