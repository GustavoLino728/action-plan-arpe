'use client'

import * as React from 'react'
import { ShieldAlertIcon, UserPlusIcon } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/components/auth-provider'
import { PageTitle } from '@/components/page-title'
import { ConfirmDelete } from '@/components/confirm-delete'
import { Button } from '@/components/button'
import { UserForm } from '@/components/user-form'
import { UsersTable } from '@/components/user-table'
import {
  fetchUsers,
  fetchDepartments,
  createUser,
  updateUser,
  deleteUser,
  type ApiDepartment,
  type ApiUser,
  type ApiUserCreate,
  type ApiUserUpdate,
} from '@/lib/api/services'

export default function UsuariosPage() {
  const { user } = useAuth()
  const [users, setUsers] = React.useState<ApiUser[]>([])
  const [departments, setDepartments] = React.useState<ApiDepartment[]>([])
  const [loading, setLoading] = React.useState(true)
  const [formOpen, setFormOpen] = React.useState(false)
  const [editingUser, setEditingUser] = React.useState<ApiUser | null>(null)
  const [saving, setSaving] = React.useState(false)
  const [toDelete, setToDelete] = React.useState<ApiUser | null>(null)

  const load = React.useCallback(async () => {
    setLoading(true)
    try {
      const [u, d] = await Promise.all([fetchUsers(), fetchDepartments()])
      setUsers(u)
      setDepartments(d)
    } catch (err: any) {
      toast.error(err.message || 'Erro ao carregar dados.')
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
            Você não possui privilégios de administrador para acessar a gestão de usuários.
          </p>
        </div>
      </main>
    )
  }

  async function handleSave(payload: ApiUserCreate | ApiUserUpdate) {
    setSaving(true)
    try {
      if (editingUser) {
        await updateUser(editingUser.id, payload as ApiUserUpdate)
        toast.success('Usuário atualizado.')
      } else {
        await createUser(payload as ApiUserCreate)
        toast.success('Usuário criado.')
      }
      await load()
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!toDelete) return
    try {
      await deleteUser(toDelete.id)
      toast.success('Usuário removido.')
      await load()
    } catch (err: any) {
      toast.error(err.message || 'Erro ao remover usuário.')
    } finally {
      setToDelete(null)
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-5">
      <PageTitle
        title="Gestão de usuários"
        description="Controle de contas, atribuições de cargos e permissões de acesso."
        actions={
          <Button onClick={() => { setEditingUser(null); setFormOpen(true) }}>
            <UserPlusIcon className="size-4" />
            Novo usuário
          </Button>
        }
      />
      <UsersTable
        users={users}
        loading={loading}
        onEdit={(u) => { setEditingUser(u); setFormOpen(true) }}
        onDelete={setToDelete}
        currentUserId={user?.id}
      />
      <UserForm
        open={formOpen}
        mode={editingUser ? 'edit' : 'create'}
        user={editingUser}
        departments={departments}
        saving={saving}
        onSave={handleSave}
        onClose={() => setFormOpen(false)}
      />
      <ConfirmDelete
        open={toDelete !== null}
        title="Excluir usuário?"
        description={toDelete ? `O usuário "${toDelete.name}" será removido permanentemente.` : ''}
        onCancel={() => setToDelete(null)}
        onConfirm={handleDelete}
      />
    </main>
  )
}