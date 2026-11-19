'use client'

import * as React from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/dialog'
import type { ApiDepartment } from '@/lib/api/services'

const labelCls = 'text-xs font-medium text-ink'
const inputCls =
  'h-9 w-full rounded-md border border-line bg-panel px-3 text-sm text-ink focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/40'

interface DepartmentFormProps {
  open: boolean
  mode: 'create' | 'edit'
  department?: ApiDepartment | null
  saving: boolean
  onSave: (payload: {
    name: string
    acronym: string | null
    is_oversight: boolean
  }) => Promise<void>
  onClose: () => void
}

export function DepartmentForm({
  open,
  mode,
  department,
  saving,
  onSave,
  onClose,
}: DepartmentFormProps) {
  const isEdit = mode === 'edit'
  const [form, setForm] = React.useState({
    name: '',
    acronym: '',
    isOversight: false,
  })

  React.useEffect(() => {
    if (!open) return
    if (isEdit && department) {
      setForm({
        name: department.name,
        acronym: department.acronym ?? '',
        isOversight: department.is_oversight,
      })
    } else {
      setForm({ name: '', acronym: '', isOversight: false })
    }
  }, [open, isEdit, department])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    try {
      await onSave({
        name: form.name.trim(),
        acronym: form.acronym.trim() || null,
        is_oversight: form.isOversight,
      })
      onClose()
    } catch (err: any) {
      toast.error(err.message || 'Erro ao salvar setor.')
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="w-[min(90vw,30rem)]">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Editar setor' : 'Novo setor'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Atualize os dados do setor.'
              : 'Cadastre um novo setor da ARPE.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className={labelCls}>Nome *</label>
            <input
              className={inputCls}
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Ex: Coordenadoria de Tecnologia da Informação"
              required
              autoFocus
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className={labelCls}>Sigla</label>
            <input
              className={inputCls}
              value={form.acronym}
              onChange={(e) => setForm((f) => ({ ...f, acronym: e.target.value }))}
              placeholder="Ex: CTI"
              maxLength={20}
            />
            <span className="text-[11px] text-ink-soft">
              Usada em listas compactas (ex: tabela de usuários).
            </span>
          </div>

          <div className="rounded-md border border-line bg-line/5 p-3">
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isOversight}
                onChange={(e) =>
                  setForm((f) => ({ ...f, isOversight: e.target.checked }))
                }
                className="mt-0.5 size-4 accent-teal"
              />
              <div className="flex flex-col gap-0.5">
                <span className="text-xs font-medium text-ink">
                  Setor de acompanhamento
                </span>
                <span className="text-[11px] text-ink-soft">
                  Membros deste setor (ex: CGRP) visualizam iniciativas de todos os
                  setores, mesmo sem role de admin ou diretor.
                </span>
              </div>
            </label>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={saving}
            >
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