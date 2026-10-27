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
const textareaCls =
  'min-h-20 w-full rounded-md border border-line bg-panel px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-teal/40 focus:border-teal'

const EMPTY_FORM = {
  strategic_perspective: '',
  objetivo: '',
  setor: '',
  nome: '',
  gestor: '',
  descricao: '',
  valorTotal: 'A definir',
  valor2026: 'A definir',
}

export function IniciativaForm() {
  const {
    iniciativaForm,
    closeIniciativaForm,
    iniciativas,
    addIniciativa,
    updateIniciativa,
    strategic_perspectives,
    setores,
  } = usePlan()

  const isOpen = iniciativaForm !== null
  const editingId = iniciativaForm?.id
  const existing = editingId ? iniciativas.find((i) => i.id === editingId) : null
  const isEdit = !!existing

  const [form, setForm] = React.useState(EMPTY_FORM)
  const [saving, setSaving] = React.useState(false)

  React.useEffect(() => {
    if (!isOpen) return
    if (existing) {
      setForm({
        strategic_perspective: existing.strategic_perspective,
        objetivo: existing.objetivo,
        setor: existing.setor,
        nome: existing.nome,
        gestor: existing.gestor,
        descricao: existing.descricao,
        valorTotal: existing.valorTotal,
        valor2026: existing.valor2026,
      })
    } else {
      setForm(EMPTY_FORM)
    }
  }, [isOpen, existing])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.strategic_perspective.trim() || !form.objetivo.trim() || !form.nome.trim()) {
      toast.error('Preencha os campos obrigatórios.')
      return
    }
    setSaving(true)
    try {
      if (isEdit) {
        await updateIniciativa(editingId!, form)
        toast.success('Iniciativa atualizada.')
      } else {
        await addIniciativa(form)
        toast.success('Iniciativa criada.')
      }
      closeIniciativaForm()
    } catch (err: any) {
      toast.error(err.message || 'Erro ao salvar.')
    } finally {
      setSaving(false)
    }
  }

  const set =
    (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }))

  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && closeIniciativaForm()}>
      <DialogContent className="w-[min(90vw,42rem)]">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Editar iniciativa' : 'Nova iniciativa'}</DialogTitle>
          <DialogDescription>
            {isEdit ? 'Atualize os dados da iniciativa.' : 'Cadastre uma nova iniciativa estratégica.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className={labelCls}>Perspectiva estratégica *</label>
            <input
              className={inputCls}
              value={form.strategic_perspective}
              onChange={set('strategic_perspective')}
              list="perspectives"
              required
            />
            <datalist id="perspectives">
              {strategic_perspectives.map((p) => <option key={p} value={p} />)}
            </datalist>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={labelCls}>Objetivo estratégico *</label>
            <input className={inputCls} value={form.objetivo} onChange={set('objetivo')} required />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label className={labelCls}>Setor responsável</label>
              <input className={inputCls} value={form.setor} onChange={set('setor')} list="setores" />
              <datalist id="setores">
                {setores.map((s) => <option key={s} value={s} />)}
              </datalist>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={labelCls}>Gestor responsável</label>
              <input className={inputCls} value={form.gestor} onChange={set('gestor')} />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={labelCls}>Nome da iniciativa *</label>
            <input className={inputCls} value={form.nome} onChange={set('nome')} required />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={labelCls}>Descrição resumida</label>
            <textarea className={textareaCls} value={form.descricao} onChange={set('descricao')} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label className={labelCls}>Valor estimado total</label>
              <input className={inputCls} value={form.valorTotal} onChange={set('valorTotal')} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={labelCls}>Valor estimado 2026</label>
              <input className={inputCls} value={form.valor2026} onChange={set('valor2026')} />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={closeIniciativaForm} disabled={saving}>
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