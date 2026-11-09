'use client'

import * as React from 'react'
import { toast } from 'sonner'
import { usePlan } from '@/components/plan-provider'
import { Button } from '@/components/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/dialog'

const labelCls = 'text-xs font-medium text-ink'
const inputCls =
  'h-9 w-full rounded-md border border-line bg-panel px-3 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-teal/40 focus:border-teal'

export function PerspectiveForm() {
  const { perspectiveForm, closePerspectiveForm, addPerspective } = usePlan()
  const isOpen = perspectiveForm !== null
  const [name, setName] = React.useState('')
  const [saving, setSaving] = React.useState(false)

  React.useEffect(() => {
    if (isOpen) setName('')
  }, [isOpen])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) {
      toast.error('Informe o nome da perspectiva.')
      return
    }
    setSaving(true)
    try {
      await addPerspective(name.trim())
      closePerspectiveForm()
    } catch (err: any) {
      toast.error(err.message || 'Erro ao criar perspectiva.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && closePerspectiveForm()}>
      <DialogContent className="w-[min(90vw,28rem)]">
        <DialogHeader>
          <DialogTitle>Nova perspectiva</DialogTitle>
          <DialogDescription>
            Adicione uma nova perspectiva estratégica ao mapa.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className={labelCls}>Nome da perspectiva *</label>
            <input
              className={inputCls}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Pessoas e Recursos"
              autoFocus
              required
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={closePerspectiveForm} disabled={saving}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Salvando...' : 'Criar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}