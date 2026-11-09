'use client'

import * as React from 'react'
import { toast } from 'sonner'
import { usePlan } from '@/components/plan-provider'
import { Button } from '@/components/button'
import { SearchableSelect } from '@/components/searcheable-select'
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

export function ObjectiveForm() {
  const { objectiveForm, closeObjectiveForm, addObjective, treeRaw } = usePlan()
  const isOpen = objectiveForm !== null

  const [perspectiveId, setPerspectiveId] = React.useState('')
  const [name, setName] = React.useState('')
  const [saving, setSaving] = React.useState(false)

  React.useEffect(() => {
    if (isOpen) {
      setPerspectiveId(objectiveForm?.defaultPerspectiveId ?? '')
      setName('')
    }
  }, [isOpen, objectiveForm?.defaultPerspectiveId])

  const perspectiveOptions = treeRaw.map((p) => ({ value: p.id, label: p.name }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!perspectiveId) {
      toast.error('Selecione a perspectiva.')
      return
    }
    if (!name.trim()) {
      toast.error('Informe o nome do objetivo.')
      return
    }
    setSaving(true)
    try {
      await addObjective(perspectiveId, name.trim())
      closeObjectiveForm()
    } catch (err: any) {
      toast.error(err.message || 'Erro ao criar objetivo.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && closeObjectiveForm()}>
      <DialogContent className="w-[min(90vw,32rem)]">
        <DialogHeader>
          <DialogTitle>Novo objetivo estratégico</DialogTitle>
          <DialogDescription>
            Adicione um novo objetivo a uma perspectiva existente.
          </DialogDescription>
        </DialogHeader>

        {perspectiveOptions.length === 0 ? (
          <div className="flex flex-col gap-3">
            <div className="rounded-md border border-line bg-line/10 p-3 text-sm text-ink-soft">
              Nenhuma perspectiva cadastrada. Crie uma perspectiva primeiro.
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={closeObjectiveForm}>
                Fechar
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className={labelCls}>Perspectiva *</label>
              <SearchableSelect
                value={perspectiveId}
                onValueChange={setPerspectiveId}
                options={perspectiveOptions}
                placeholder="Selecione a perspectiva..."
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={labelCls}>Nome do objetivo *</label>
              <input
                className={inputCls}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Fortalecer a estrutura da ARPE e fomentar a inovação"
                required
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeObjectiveForm} disabled={saving}>
                Cancelar
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? 'Salvando...' : 'Criar'}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}