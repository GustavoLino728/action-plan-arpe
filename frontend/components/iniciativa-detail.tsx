'use client'

import { ArrowLeftIcon, EyeIcon, ListPlusIcon, PencilIcon, PlusIcon, Trash2Icon } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import * as React from 'react'
import { toast } from 'sonner'
import { ConfirmDelete } from '@/components/confirm-delete'
import { IconAction } from '@/components/icon-action'
import { PageTitle } from '@/components/page-title'
import { usePlan } from '@/components/plan-provider'
import { ProgressBar } from '@/components/progress-bar'
import { StatusBadge, ToneBadge } from '@/components/status-badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '@/components/ui/empty'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
  TONE_TEXT,
  averageProgress,
  buildIniciativaNodes,
  countByStatus,
  deadlineInfo,
  effectiveStatus,
  formatDate,
  formatValor,
} from '@/lib/plan-utils'
import type { EtapaRow, KR } from '@/lib/types'
import { cn } from '@/lib/utils'

function Info({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('flex flex-col gap-1', className)}>
      <dt className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{label}</dt>
      <dd className="text-sm text-pretty">{children}</dd>
    </div>
  )
}

type Pending = { type: 'iniciativa' } | { type: 'kr'; kr: KR } | { type: 'etapa'; etapa: EtapaRow } | null

export function IniciativaDetail({ id }: { id: string }) {
  const {
    iniciativas,
    krs,
    rows,
    justSummary,
    openIniciativaForm,
    openKrForm,
    openCreateEtapa,
    openView,
    openEdit,
    deleteIniciativa,
    deleteKr,
    deleteEtapa,
    loading,
  } = usePlan()
  const router = useRouter()
  const [pending, setPending] = React.useState<Pending>(null)

  const iniciativa = iniciativas.find((i) => i.id === id)
  const node = React.useMemo(() => (iniciativa ? buildIniciativaNodes([iniciativa], krs, rows)[0] : null), [iniciativa, krs, rows])

  if (loading && !iniciativa) {
    return (
      <main className="mx-auto flex w-full max-w-7xl flex-col gap-5 p-12 text-center text-muted-foreground">
        <div className="flex flex-col items-center justify-center gap-3">
          <div className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm">Carregando dados da iniciativa do backend...</p>
        </div>
      </main>
    )
  }

  if (!iniciativa || !node) {
    return (
      <main className="mx-auto flex w-full max-w-7xl flex-col gap-5">
        <Empty className="rounded-lg border bg-card">
          <EmptyHeader>
            <EmptyTitle>Iniciativa não encontrada</EmptyTitle>
            <EmptyDescription>Ela pode ter sido excluída ou o endereço está incorreto.</EmptyDescription>
          </EmptyHeader>
          <Button nativeButton={false} render={<Link href="/planos" />}>Voltar aos Planos de Ação</Button>
        </Empty>
      </main>
    )
  }

  const progress = averageProgress(node.etapas)
  const counts = countByStatus(node.etapas)

  const pendingCopy = (() => {
    if (!pending) return { title: '', description: '' }
    if (pending.type === 'iniciativa')
      return {
        title: 'Excluir iniciativa?',
        description: `A iniciativa "${iniciativa.nome}" será removida junto com ${node.krs.length} KR(s) e ${node.etapas.length} etapa(s). Esta ação não pode ser desfeita.`,
      }
    if (pending.type === 'kr') {
      const count = node.krs.find((k) => k.kr.id === pending.kr.id)?.etapas.length ?? 0
      return { title: 'Excluir KR?', description: `O KR será removido junto com ${count} etapa(s). Esta ação não pode ser desfeita.` }
    }
    return { title: 'Excluir etapa?', description: `A etapa "${pending.etapa.nome}" e suas justificativas serão removidas. Esta ação não pode ser desfeita.` }
  })()

  function confirmDelete() {
    if (!pending) return
    if (pending.type === 'iniciativa') {
      deleteIniciativa(iniciativa!.id)
      toast.success('Iniciativa excluída.')
      router.push('/planos')
    } else if (pending.type === 'kr') {
      deleteKr(pending.kr.id)
      toast.success('KR excluído.')
    } else {
      deleteEtapa(pending.etapa.id)
      toast.success('Etapa excluída.')
    }
    setPending(null)
  }

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-5">
      <Button variant="ghost" size="sm" className="-ml-2 w-fit" nativeButton={false} render={<Link href="/planos" />}>
        <ArrowLeftIcon data-icon="inline-start" />
        Planos de Ação
      </Button>

      <PageTitle
        title={iniciativa.nome}
        description={`${iniciativa.strategic_perspective} · ${iniciativa.objetivo}`}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => openIniciativaForm(iniciativa.id)}>
              <PencilIcon data-icon="inline-start" />
              Editar
            </Button>
            <Button variant="outline" className="text-destructive hover:text-destructive" onClick={() => setPending({ type: 'iniciativa' })}>
              <Trash2Icon data-icon="inline-start" />
              Excluir
            </Button>
            <Button onClick={() => openKrForm(iniciativa.id)}>
              <PlusIcon data-icon="inline-start" />
              Adicionar KR
            </Button>
          </div>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>Dados da iniciativa</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-4">
            <Info label="StrategicPerspective estratégica">{iniciativa.strategic_perspective}</Info>
            <Info label="objetivo estratégico" className="lg:col-span-3">
              {iniciativa.objetivo}
            </Info>
            <Info label="Setor responsável" className="lg:col-span-2">
              {iniciativa.setor}
            </Info>
            <Info label="Gestor responsável">{iniciativa.gestor}</Info>
            <Info label="Progresso geral">
              <ProgressBar value={progress} showLabel label="Progresso geral da iniciativa" />
            </Info>
            <Info label="Valor estimado total">{formatValor(iniciativa.valorTotal)}</Info>
            <Info label="Valor estimado 2026">{formatValor(iniciativa.valor2026)}</Info>
            <Info label="Etapas" className="lg:col-span-2">
              <span className="flex flex-wrap gap-1.5">
                <ToneBadge tone="success">{counts.concluido} concluídas</ToneBadge>
                <ToneBadge tone="info">{counts.em_andamento} em andamento</ToneBadge>
                <ToneBadge tone="muted">{counts.a_iniciar} a iniciar</ToneBadge>
                {counts.atrasado > 0 && <ToneBadge tone="danger">{counts.atrasado} atrasadas</ToneBadge>}
              </span>
            </Info>
            <Info label="Descrição resumida" className="sm:col-span-2 lg:col-span-4">
              {iniciativa.descricao || <span className="text-muted-foreground">Sem descrição.</span>}
            </Info>
          </dl>
        </CardContent>
      </Card>

      <section aria-label="KRs da iniciativa" className="flex flex-col gap-4">
        <h2 className="text-base font-semibold">KRs e etapas ({node.krs.length})</h2>

        {node.krs.length === 0 && (
          <Empty className="rounded-lg border bg-card">
            <EmptyHeader>
              <EmptyTitle>Nenhum KR cadastrado</EmptyTitle>
              <EmptyDescription>Os setores adicionam seus KRs à iniciativa e, dentro de cada KR, cadastram as etapas.</EmptyDescription>
            </EmptyHeader>
            <Button onClick={() => openKrForm(iniciativa.id)}>
              <PlusIcon data-icon="inline-start" />
              Adicionar KR
            </Button>
          </Empty>
        )}

        {node.krs.map(({ kr, etapas: krEtapas }) => (
          <Card key={kr.id}>
            <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3">
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <span className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">KR · Setor {kr.setor || 'não informado'}</span>
                <CardTitle className="text-base text-balance">{kr.nome}</CardTitle>
                <ProgressBar value={averageProgress(krEtapas)} showLabel className="max-w-xs" label={`Progresso do KR ${kr.nome}`} />
              </div>
              <div className="flex flex-wrap items-center gap-1">
                <Button size="sm" onClick={() => openCreateEtapa(kr.id)}>
                  <ListPlusIcon data-icon="inline-start" />
                  Nova etapa
                </Button>
                <IconAction label="Editar KR" onClick={() => openKrForm(iniciativa.id, kr.id)}>
                  <PencilIcon />
                </IconAction>
                <IconAction label="Excluir KR" destructive onClick={() => setPending({ type: 'kr', kr })}>
                  <Trash2Icon />
                </IconAction>
              </div>
            </CardHeader>
            <CardContent>
              {krEtapas.length === 0 ? (
                <p className="rounded-md border border-dashed px-3 py-4 text-center text-sm text-muted-foreground">Nenhuma etapa neste KR. Use &ldquo;Nova etapa&rdquo; para cadastrar.</p>
              ) : (
                <div className="overflow-hidden rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50 hover:bg-muted/50">
                        <TableHead className="w-12">Nº</TableHead>
                        <TableHead className="min-w-56">Nome da etapa</TableHead>
                        <TableHead>Responsável</TableHead>
                        <TableHead>Início</TableHead>
                        <TableHead>Término</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="min-w-32">Previsto</TableHead>
                        <TableHead className="min-w-32">Realizado</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {krEtapas.map((e) => {
                        const status = effectiveStatus(e)
                        const deadline = deadlineInfo(e)
                        const just = justSummary[e.id]
                        return (
                          <TableRow key={e.id}>
                            <TableCell className="tabular-nums text-muted-foreground">{e.numero}</TableCell>
                            <TableCell className="max-w-72 whitespace-normal">
                              <div className="flex flex-col gap-1">
                                <span className="font-medium">{e.nome}</span>
                                {status === 'atrasado' && (
                                  <button
                                    type="button"
                                    onClick={() => openView(e.id, 'justificativas')}
                                    className="w-fit rounded-sm text-left text-xs font-medium text-destructive underline-offset-4 outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"
                                  >
                                    {just ? `${just.total} justificativa(s) · ${just.abertas} em aberto` : 'Registrar justificativa de atraso'}
                                  </button>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-muted-foreground">{e.responsavel}</TableCell>
                            <TableCell className="tabular-nums">{formatDate(e.dataInicio)}</TableCell>
                            <TableCell>
                              <div className="flex flex-col">
                                <span className="tabular-nums">{formatDate(e.dataTermino)}</span>
                                <span className={cn('text-xs font-medium', TONE_TEXT[deadline.tone])}>{deadline.label}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <StatusBadge status={status} />
                            </TableCell>
                            <TableCell>
                              <ProgressBar value={e.previsto} tone="muted" showLabel label={`Previsto da etapa ${e.nome}`} />
                            </TableCell>
                            <TableCell>
                              <ProgressBar value={e.realizado} tone={status === 'atrasado' ? 'danger' : status === 'concluido' ? 'success' : 'info'} showLabel label={`Realizado da etapa ${e.nome}`} />
                            </TableCell>
                            <TableCell>
                              <div className="flex justify-end gap-0.5">
                                <IconAction label="Ver detalhes" onClick={() => openView(e.id)}>
                                  <EyeIcon />
                                </IconAction>
                                <IconAction label="Editar etapa" onClick={() => openEdit(e.id)}>
                                  <PencilIcon />
                                </IconAction>
                                <IconAction label="Excluir etapa" destructive onClick={() => setPending({ type: 'etapa', etapa: e })}>
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
              )}
            </CardContent>
          </Card>
        ))}
      </section>

      <ConfirmDelete open={pending !== null} title={pendingCopy.title} description={pendingCopy.description} onCancel={() => setPending(null)} onConfirm={confirmDelete} />
    </main>
  )
}
