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
import type { Status } from '@/lib/types'

const labelCls = 'text-xs font-medium text-ink'
const inputCls =
  'h-9 w-full rounded-md border border-line bg-panel px-3 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-teal/40 focus:border-teal'

export function KrForm() {
  const { krForm, closeKrForm, krs, addKr, updateKr } = usePlan()

  const isOpen = krForm !== null
  const editingId = krForm?.id
  const existing = editingId ? krs.find((k) => k.id === editingId) : null
  const isEdit = !!existing

  const [form, setForm] = React.useState({
    nome: '',
    setor: '',
    dataInicio: '',
    dataTermino: '',
    dataInicioRealizado: '',
    dataTerminoRealizado: '',
    responsavel: '',
    status: '' as Status | '',
  })
  const [saving, setSaving] = React.useState(false)

  React.useEffect(() => {
    if (!isOpen) return
    if (existing) {
      setForm({
        nome: existing.nome,
        setor: existing.setor,
        dataInicio: existing.dataInicio ?? '',
        dataTermino: existing.dataTermino ?? '',
        dataInicioRealizado: existing.dataInicioRealizado ?? '',
        dataTerminoRealizado: existing.dataTerminoRealizado ?? '',
        responsavel: existing.responsavel ?? '',
        status: (existing.status ?? '') as Status | '',
      })
    } else {
      setForm({
        nome: '',
        setor: '',
        dataInicio: '',
        dataTermino: '',
        dataInicioRealizado: '',
        dataTerminoRealizado: '',
        responsavel: '',
        status: '',
      })
    }
  }, [isOpen, existing])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.nome.trim() || !krForm) return
    setSaving(true)
    try {
      const payload = {
        iniciativaId: krForm.iniciativaId,
        nome: form.nome,
        setor: form.setor,
        dataInicio: form.dataInicio || undefined,
        dataTermino: form.dataTermino || undefined,
        dataInicioRealizado: form.dataInicioRealizado || undefined,
        dataTerminoRealizado: form.dataTerminoRealizado || undefined,
        responsavel: form.responsavel || undefined,
        status: form.status || undefined,
      }
      if (isEdit) {
        await updateKr(editingId!, payload)
      } else {
        await addKr(payload)
      }
      closeKrForm()
    } catch (err: any) {
      toast.error(err.message || 'Erro ao salvar KR.')
    } finally {
      setSaving(false)
    }
  }

  const set =
    (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }))

  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && closeKrForm()}>
      <DialogContent className="w-[min(90vw,36rem)]">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Editar KR' : 'Novo KR'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Atualize os dados do resultado-chave.'
              : 'Adicione um resultado-chave à iniciativa.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className={labelCls}>Nome do KR *</label>
            <input className={inputCls} value={form.nome} onChange={set('nome')} required />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={labelCls}>Setor / Meta</label>
            <input className={inputCls} value={form.setor} onChange={set('setor')} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label className={labelCls}>Data início prevista</label>
              <input type="date" className={inputCls} value={form.dataInicio} onChange={set('dataInicio')} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={labelCls}>Data término prevista</label>
              <input type="date" className={inputCls} value={form.dataTermino} onChange={set('dataTermino')} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={labelCls}>Data início realizada</label>
              <input type="date" className={inputCls} value={form.dataInicioRealizado} onChange={set('dataInicioRealizado')} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={labelCls}>Data término realizada</label>
              <input type="date" className={inputCls} value={form.dataTerminoRealizado} onChange={set('dataTerminoRealizado')} />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label className={labelCls}>Responsável</label>
              <input className={inputCls} value={form.responsavel} onChange={set('responsavel')} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={labelCls}>Status</label>
              <select className={inputCls} value={form.status} onChange={set('status')}>
                <option value="">—</option>
                <option value="a_iniciar">A Iniciar</option>
                <option value="em_andamento">Em Andamento</option>
                <option value="concluido">Concluído</option>
                <option value="atrasado">Atrasado</option>
              </select>
            </div>
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