'use client'

import * as React from 'react'
import { Building2Icon, PencilIcon, Trash2Icon } from 'lucide-react'
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
import type { ApiDepartment } from '@/lib/api/services'

interface DepartmentsTableProps {
  departments: ApiDepartment[]
  loading: boolean
  onEdit: (dept: ApiDepartment) => void
  onDelete: (dept: ApiDepartment) => void
}

export function DepartmentsTable({
  departments,
  loading,
  onEdit,
  onDelete,
}: DepartmentsTableProps) {
  return (
    <div className="overflow-hidden rounded-lg border border-line bg-panel">
      {loading ? (
        <div className="flex flex-col items-center justify-center gap-3 py-20 text-ink-soft">
          <div className="size-7 animate-spin rounded-full border-2 border-teal border-t-transparent" />
          <span className="text-sm font-medium">Carregando setores…</span>
        </div>
      ) : departments.length === 0 ? (
        <Empty className="p-12">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Building2Icon />
            </EmptyMedia>
            <EmptyTitle>Nenhum setor cadastrado</EmptyTitle>
            <EmptyDescription>
              Cadastre os setores da ARPE para vincular usuários e iniciativas.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <Table>
          <TableHeader>
            <TableRow className="bg-line/10 hover:bg-line/10">
              <TableHead>Nome</TableHead>
              <TableHead className="w-32">Sigla</TableHead>
              <TableHead>Escopo de visibilidade</TableHead>
              <TableHead className="w-24 text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {departments.map((d) => (
              <TableRow key={d.id}>
                <TableCell className="font-medium text-ink">{d.name}</TableCell>
                <TableCell className="text-ink-soft">{d.acronym ?? '—'}</TableCell>
                <TableCell>
                  {d.is_oversight ? (
                    <span className="inline-flex rounded-md bg-purple-500/10 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-purple-600 dark:text-purple-400">
                      Vê todos os setores
                    </span>
                  ) : (
                    <span className="text-xs text-ink-soft">Só o próprio setor</span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex justify-end gap-0.5">
                    <IconAction label="Editar setor" onClick={() => onEdit(d)}>
                      <PencilIcon />
                    </IconAction>
                    <IconAction
                      label="Excluir setor"
                      destructive
                      onClick={() => onDelete(d)}
                    >
                      <Trash2Icon />
                    </IconAction>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  )
}