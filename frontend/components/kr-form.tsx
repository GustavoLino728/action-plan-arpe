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

export function KrForm() {
  const { krForm, closeKrForm, krs, addKr, updateKr } = usePlan()

  const isOpen = krForm !== null
  const editingId = krForm?.id
  const existing = editingId ? krs.find((k) => k.id === editingId) : null
  const isEdit = !!existing

  const [nome, setNome] = React.useState('')
  const [setor, setSetor] = React.useState('')
  const [saving, setSaving] = React.useState(false)

  React.useEffect(() => {
    if (!isOpen) return
    if (existing) {
      setNome(existing.nome)
      setSetor(existing.setor)
    } else {
      setNome('')
      setSetor('')
    }
  }, [isOpen, existing])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!nome.trim() || !krForm) return
    setSaving(true)
    try {
      if (isEdit) {
        await updateKr(editingId!, { iniciativaId: krForm.iniciativaId, nome, setor })
        toast.success('KR atualizado.')
      } else {
        await addKr({ iniciativaId: krForm.iniciativaId, nome, setor })
        toast.success('KR criado.')
      }
      closeKrForm()
    } catch (err: any) {
      toast.error(err.message || 'Erro ao salvar KR.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && closeKrForm()}>
      <DialogContent className="w-[min(90vw,32rem)]">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Editar KR' : 'Novo KR'}</DialogTitle>
          <DialogDescription>
            {isEdit ? 'Atualize o resultado-chave.' : 'Adicione um resultado-chave à iniciativa.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className={labelCls}>Nome do KR *</label>
            <input className={inputCls} value={nome} onChange={(e) => setNome(e.target.value)} required />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={labelCls}>Setor do KR</label>
            <input className={inputCls} value={setor} onChange={(e) => setSetor(e.target.value)} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={closeKrForm} disabled={saving}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Salvando...' : isEdit ? 'Salvar' : 'Criar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}