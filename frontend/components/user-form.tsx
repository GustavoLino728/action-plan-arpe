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
import type {
  ApiDepartment,
  ApiUser,
  ApiUserCreate,
  ApiUserUpdate,
  UserRole,
} from '@/lib/api/services'

const labelCls = 'text-xs font-medium text-ink'
const inputCls =
  'h-9 w-full rounded-md border border-line bg-panel px-3 text-sm text-ink focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/40'

interface UserFormProps {
  open: boolean
  mode: 'create' | 'edit'
  user?: ApiUser | null
  departments: ApiDepartment[]
  saving: boolean
  onSave: (payload: ApiUserCreate | ApiUserUpdate) => Promise<void>
  onClose: () => void
}

export function UserForm({ open, mode, user, departments, saving, onSave, onClose }: UserFormProps) {
  const isEdit = mode === 'edit'
  const [form, setForm] = React.useState({
    name: '',
    email: '',
    password: '',
    role: 'servidor' as UserRole,
    departmentId: '',
    isActive: true,
  })

  React.useEffect(() => {
    if (!open) return
    if (isEdit && user) {
      setForm({
        name: user.name,
        email: user.email,
        password: '',
        role: user.role,
        departmentId: user.department_id ?? '',
        isActive: user.is_active,
      })
    } else {
      setForm({
        name: '',
        email: '',
        password: '',
        role: 'servidor',
        departmentId: '',
        isActive: true,
      })
    }
  }, [open, isEdit, user])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    try {
      if (isEdit) {
        const payload: ApiUserUpdate = {
          name: form.name,
          role: form.role,
          is_active: form.isActive,
          department_id: form.departmentId || null,
        }
        if (form.password) payload.password = form.password
        await onSave(payload)
      } else {
        await onSave({
          name: form.name,
          email: form.email,
          password: form.password,
          role: form.role,
          department_id: form.departmentId || null,
        } as ApiUserCreate)
      }
      onClose()
    } catch (err: any) {
      toast.error(err.message || 'Erro ao salvar usuário.')
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="w-[min(90vw,32rem)]">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Editar usuário' : 'Novo usuário'}</DialogTitle>
          <DialogDescription>
            {isEdit ? 'Atualize os dados do usuário.' : 'Cadastre um novo usuário na plataforma.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className={labelCls}>Nome completo *</label>
            <input className={inputCls} value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={labelCls}>E-mail institucional *</label>
            <input type="email" className={inputCls} value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} required disabled={isEdit} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label className={labelCls}>Papel de acesso *</label>
              <select className={inputCls} value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value as UserRole }))}>
                <option value="servidor">Servidor</option>
                <option value="coordenador">Coordenador</option>
                <option value="diretor">Diretor</option>
                <option value="admin">Administrador</option>
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={labelCls}>Setor</label>
              <select className={inputCls} value={form.departmentId} onChange={(e) => setForm((f) => ({ ...f, departmentId: e.target.value }))}>
                <option value="">— Nenhum —</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>{d.acronym ?? d.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={labelCls}>{isEdit ? 'Redefinir senha (opcional)' : 'Senha de acesso *'}</label>
            <input
              type="password"
              className={inputCls}
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              required={!isEdit}
              minLength={6}
              placeholder={isEdit ? 'Deixe em branco para manter a atual' : 'Mínimo de 6 caracteres'}
            />
          </div>
          {isEdit && (
            <div className="flex items-center gap-2 border-t border-line/40 pt-3">
              <input id="active-toggle" type="checkbox" checked={form.isActive} onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))} className="size-4 accent-teal" />
              <label htmlFor="active-toggle" className="text-xs text-ink">Conta ativa</label>
            </div>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={saving}>Cancelar</Button>
            <Button type="submit" disabled={saving}>{saving ? 'Salvando...' : isEdit ? 'Salvar' : 'Criar'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}