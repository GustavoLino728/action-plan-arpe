'use client'

import * as React from 'react'
import { PlusIcon, ShieldAlertIcon } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/components/auth-provider'
import { PageTitle } from '@/components/page-title'
import { ConfirmDelete } from '@/components/confirm-delete'
import { Button } from '@/components/button'
import { DepartmentForm } from '@/components/department-form'
import { DepartmentsTable } from '@/components/departments-table'
import {
  fetchDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  type ApiDepartment,
} from '@/lib/api/services'

export default function DepartmentsPage() {
  const { user } = useAuth()
  const [departments, setDepartments] = React.useState<ApiDepartment[]>([])
  const [loading, setLoading] = React.useState(true)
  const [formOpen, setFormOpen] = React.useState(false)
  const [editing, setEditing] = React.useState<ApiDepartment | null>(null)
  const [saving, setSaving] = React.useState(false)
  const [toDelete, setToDelete] = React.useState<ApiDepartment | null>(null)

  const load = React.useCallback(async () => {
    setLoading(true)
    try {
      setDepartments(await fetchDepartments())
    } catch (err: any) {
      toast.error(err.message || 'Erro ao carregar setores.')
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    if (user?.role === 'admin') load()
  }, [user, load])

  if (user?.role !== 'admin') {
    return (
      <main className="mx-auto flex w-full max-w-7xl flex-col gap-5">
        <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
          <div className="flex size-16 items-center justify-center rounded-full bg-rose-500/10 text-rose-500">
            <ShieldAlertIcon className="size-8" />
          </div>
          <h2 className="text-xl font-bold text-ink">Acesso restrito</h2>
          <p className="max-w-md text-sm text-ink-soft">
            Apenas administradores podem gerenciar os setores.
          </p>
        </div>
      </main>
    )
  }

  async function handleSave(payload: {
    name: string
    acronym: string | null
    is_oversight: boolean
  }) {
    setSaving(true)
    try {
      if (editing) {
        await updateDepartment(editing.id, payload)
        toast.success('Setor atualizado.')
      } else {
        await createDepartment(payload)
        toast.success('Setor criado.')
      }
      await load()
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!toDelete) return
    try {
      await deleteDepartment(toDelete.id)
      toast.success('Setor removido.')
      await load()
    } catch (err: any) {
      toast.error(err.message || 'Erro ao remover setor.')
    } finally {
      setToDelete(null)
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-5">
      <PageTitle
        title="Setores"
        description="Cadastro dos setores da ARPE. Membros de setores de acompanhamento visualizam iniciativas de todos os setores."
        actions={
          <Button
            onClick={() => {
              setEditing(null)
              setFormOpen(true)
            }}
          >
            <PlusIcon className="size-4" />
            Novo setor
          </Button>
        }
      />

      <DepartmentsTable
        departments={departments}
        loading={loading}
        onEdit={(d) => {
          setEditing(d)
          setFormOpen(true)
        }}
        onDelete={setToDelete}
      />

      <DepartmentForm
        open={formOpen}
        mode={editing ? 'edit' : 'create'}
        department={editing}
        saving={saving}
        onSave={handleSave}
        onClose={() => setFormOpen(false)}
      />

      <ConfirmDelete
        open={toDelete !== null}
        title="Excluir setor?"
        description={
          toDelete
            ? `O setor "${toDelete.name}" será removido. Usuários e iniciativas vinculados ficarão sem setor (NULL). Esta ação não pode ser desfeita.`
            : ''
        }
        onCancel={() => setToDelete(null)}
        onConfirm={handleDelete}
      />
    </main>
  )
}