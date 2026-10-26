'use client'

import { PencilIcon, SearchXIcon, Trash2Icon } from 'lucide-react'
import Link from 'next/link'
import * as React from 'react'
import { toast } from 'sonner'
import { ConfirmDelete } from '@/components/confirm-delete'
import { IconAction } from '@/components/icon-action'
import { usePlan } from '@/components/plan-provider'
import { ProgressBar } from '@/components/progress-bar'
import { ToneBadge } from '@/components/status-bagde'
import { Button } from '@/components/button'
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
import { averageProgress, buildIniciativaNodes, countByStatus } from '@/lib/plan-utils'
import type { Iniciativa } from '@/lib/types'

export function InitiativesTable() {
  const {
    scopeIniciativas,
    scopeKrs,
    filtered,
    deleteIniciativa,
    openIniciativaForm,
    krs,
    etapas,
    iniciativas,
    searching,
    loading,
  } = usePlan()
  const [toDelete, setToDelete] = React.useState<Iniciativa | null>(null)

  const nodes = React.useMemo(
    () => buildIniciativaNodes(scopeIniciativas, scopeKrs, filtered),
    [scopeIniciativas, scopeKrs, filtered],
  )

  const deleteSummary = React.useMemo(() => {
    if (!toDelete) return ''
    const krIds = krs.filter((k) => k.iniciativaId === toDelete.id).map((k) => k.id)
    const etapaCount = etapas.filter((e) => krIds.includes(e.krId)).length
    return `A iniciativa "${toDelete.nome}" será removida junto com ${krIds.length} ${krIds.length === 1 ? 'KR' : 'KRs'} e ${etapaCount} ${etapaCount === 1 ? 'etapa' : 'etapas'}. Esta ação não pode ser desfeita.`
  }, [toDelete, krs, etapas])

  if (nodes.length === 0) {
    if (iniciativas.length === 0 && !searching) {
      return (
        <Empty className="rounded-lg border border-line bg-panel p-8">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <SearchXIcon />
            </EmptyMedia>
            <EmptyTitle>Nenhuma iniciativa encontrada no backend</EmptyTitle>
            <EmptyDescription>
              O banco de dados está conectado e pronto para receber o planejamento. Você pode cadastrar uma nova iniciativa ou importar uma planilha.
            </EmptyDescription>
          </EmptyHeader>
          <Button onClick={() => openIniciativaForm()} className="mt-2">
            + Nova Iniciativa
          </Button>
        </Empty>
      )
    }

    return (
      <Empty className="rounded-lg border border-line bg-panel">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <SearchXIcon />
          </EmptyMedia>
          <EmptyTitle>Nenhuma iniciativa encontrada</EmptyTitle>
          <EmptyDescription>Ajuste a busca ou os filtros, ou cadastre uma nova iniciativa estratégica.</EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  }

  return (
    <>
      <div className="overflow-hidden rounded-lg border border-line bg-panel">
        <Table>
          <TableHeader>
            <TableRow className="bg-line/10 hover:bg-line/10">
              <TableHead className="min-w-72">Iniciativa estratégica</TableHead>
              <TableHead>Setor / Gestor</TableHead>
              <TableHead className="text-center">KRs</TableHead>
              <TableHead className="text-center">Etapas</TableHead>
              <TableHead>Atrasos</TableHead>
              <TableHead className="min-w-36">Progresso</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {nodes.map(({ iniciativa, krs: krNodes, etapas: etapaRows }) => {
              const late = countByStatus(etapaRows).atrasado
              return (
                <TableRow key={iniciativa.id}>
                  <TableCell className="max-w-96 whitespace-normal">
                    <div className="flex flex-col gap-0.5">
                      <Link
                        href={`/planos/${iniciativa.id}`}
                        className="font-medium text-teal underline-offset-4 hover:underline"
                      >
                        {iniciativa.nome}
                      </Link>
                      <span className="text-xs text-ink-soft">
                        {iniciativa.strategic_perspective} · {iniciativa.objetivo}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="max-w-56 whitespace-normal">
                    <div className="flex flex-col">
                      <span className="text-sm">{iniciativa.setor}</span>
                      <span className="text-xs text-ink-soft">{iniciativa.gestor}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center tabular-nums">{krNodes.length}</TableCell>
                  <TableCell className="text-center tabular-nums">{etapaRows.length}</TableCell>
                  <TableCell>
                    {late > 0 ? (
                      <ToneBadge tone="danger">
                        {late} {late === 1 ? 'etapa' : 'etapas'}
                      </ToneBadge>
                    ) : (
                      <span className="text-xs text-ink-soft">Nenhum</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <ProgressBar
                      value={averageProgress(etapaRows)}
                      showLabel
                      label={`Progresso da iniciativa ${iniciativa.nome}`}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-0.5">
                      <IconAction
                        label="Editar iniciativa"
                        onClick={() => openIniciativaForm(iniciativa.id)}
                      >
                        <PencilIcon />
                      </IconAction>
                      <IconAction
                        label="Excluir iniciativa"
                        destructive
                        onClick={() => setToDelete(iniciativa)}
                      >
                        <Trash2Icon />
                      </IconAction>
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      <ConfirmDelete
        open={toDelete !== null}
        title="Excluir iniciativa?"
        description={deleteSummary}
        onCancel={() => setToDelete(null)}
        onConfirm={() => {
          if (toDelete) {
            deleteIniciativa(toDelete.id)
            toast.success('Iniciativa excluída.')
          }
          setToDelete(null)
        }}
      />
    </>
  )
}