'use client'

import * as React from 'react'
import { PencilIcon, SearchIcon, Trash2Icon, UserCheckIcon, UserXIcon, UsersIcon } from 'lucide-react'
import { IconAction } from '@/components/icon-action'
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/empty'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/table'
import type { ApiUser, UserRole } from '@/lib/api/services'

const ROLE_LABEL: Record<UserRole, string> = {
  admin: 'Administrador',
  diretor: 'Diretor',
  coordenador: 'Coordenador',
  servidor: 'Servidor',
}

const ROLE_COLOR: Record<UserRole, string> = {
  admin: 'text-teal bg-teal/10',
  diretor: 'text-purple-600 bg-purple-500/10 dark:text-purple-400',
  coordenador: 'text-blue-600 bg-blue-500/10 dark:text-blue-400',
  servidor: 'text-ink-soft bg-line/60',
}

interface UsersTableProps {
  users: ApiUser[]
  loading: boolean
  onEdit: (user: ApiUser) => void
  onDelete: (user: ApiUser) => void
  currentUserId?: string
}

export function UsersTable({ users, loading, onEdit, onDelete, currentUserId }: UsersTableProps) {
  const [search, setSearch] = React.useState('')

  const filtered = React.useMemo(() => {
    const q = search.toLowerCase().trim()
    if (!q) return users
    return users.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.role.toLowerCase().includes(q) ||
        (u.department?.name ?? '').toLowerCase().includes(q),
    )
  }, [users, search])

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-4 rounded-lg border border-line bg-panel p-4">
        <div className="relative w-full max-w-sm">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-soft" />
          <input
            type="search"
            placeholder="Pesquisar por nome, e-mail ou setor…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 w-full rounded-lg border border-line bg-panel pl-9 pr-4 text-sm text-ink focus:border-teal focus:outline-none"
          />
        </div>
        <div className="text-xs text-ink-soft">
          Total: <strong className="text-ink">{filtered.length}</strong>{' '}
          {filtered.length === 1 ? 'usuário' : 'usuários'}
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-line bg-panel">
        {loading ? (
          <div className="flex flex-col items-center justify-center gap-3 py-20 text-ink-soft">
            <div className="size-7 animate-spin rounded-full border-2 border-teal border-t-transparent" />
            <span className="text-sm font-medium">Carregando usuários…</span>
          </div>
        ) : filtered.length === 0 ? (
          <Empty className="p-12">
            <EmptyHeader>
              <EmptyMedia variant="icon"><UsersIcon /></EmptyMedia>
              <EmptyTitle>Nenhum usuário encontrado</EmptyTitle>
              <EmptyDescription>
                {search ? 'Tente redefinir a busca.' : 'Cadastre o primeiro usuário da plataforma.'}
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-line/10 hover:bg-line/10">
                <TableHead>Nome</TableHead>
                <TableHead>E-mail</TableHead>
                <TableHead>Setor</TableHead>
                <TableHead>Papel</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium text-ink">{u.name}</TableCell>
                  <TableCell className="text-ink-soft">{u.email}</TableCell>
                  <TableCell className="text-ink-soft">
                    {u.department?.acronym ?? u.department?.name ?? '—'}
                  </TableCell>
                  <TableCell>
                    <span className={`inline-block rounded-md px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${ROLE_COLOR[u.role]}`}>
                      {ROLE_LABEL[u.role]}
                    </span>
                  </TableCell>
                  <TableCell>
                    {u.is_active ? (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-teal">
                        <UserCheckIcon className="size-3.5" /> Ativo
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-rose-500">
                        <UserXIcon className="size-3.5" /> Inativo
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-0.5">
                      <IconAction label="Editar" onClick={() => onEdit(u)}><PencilIcon /></IconAction>
                      <IconAction
                        label="Excluir"
                        destructive
                        onClick={() => onDelete(u)}
                        disabled={currentUserId === u.id}
                        className={currentUserId === u.id ? 'opacity-30 cursor-not-allowed' : ''}
                      ><Trash2Icon /></IconAction>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  )
}