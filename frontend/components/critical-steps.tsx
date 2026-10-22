'use client'

import { CheckCircle2Icon } from 'lucide-react'
import { usePlan } from '@/components/plan-provider'
import { StatusBadge } from '@/components/status-badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { TONE_TEXT, daysBetween, deadlineInfo, effectiveStatus, formatDate, REFERENCE_DATE } from '@/lib/plan-utils'
import type { Etapa } from '@/lib/types'
import { cn } from '@/lib/utils'

export function CriticalSteps({ etapas }: { etapas: Etapa[] }) {
  const { openView } = usePlan()

  const critical = etapas
    .filter((e) => {
      if (e.status === 'concluido') return false
      const late = effectiveStatus(e) === 'atrasado'
      const soon = e.dataTermino && daysBetween(REFERENCE_DATE, e.dataTermino) >= 0 && daysBetween(REFERENCE_DATE, e.dataTermino) <= 30
      return late || soon
    })
    .sort((a, b) => (a.dataTermino || '').localeCompare(b.dataTermino || ''))

  return (
    <Card>
      <CardHeader>
        <CardTitle>Etapas críticas</CardTitle>
        <CardDescription>Etapas atrasadas ou com vencimento nos próximos 30 dias.</CardDescription>
      </CardHeader>
      <CardContent>
        {critical.length === 0 ? (
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <CheckCircle2Icon />
              </EmptyMedia>
              <EmptyTitle>Nenhuma etapa crítica</EmptyTitle>
              <EmptyDescription>Todas as etapas estão dentro do prazo.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  <TableHead>Etapa</TableHead>
                  <TableHead>Responsável</TableHead>
                  <TableHead>Prazo</TableHead>
                  <TableHead>Situação</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {critical.map((e) => {
                  const d = deadlineInfo(e)
                  const iniciativaNome =
                    'iniciativa' in e && e.iniciativa && typeof e.iniciativa === 'object'
                      ? (e.iniciativa as any).nome
                      : (e as any).iniciativa || ''
                  return (
                    <TableRow key={e.id} className="cursor-pointer" onClick={() => openView(e.id)}>
                      <TableCell className="max-w-80">
                        <button type="button" onClick={() => openView(e.id)} className="text-left font-medium whitespace-normal hover:underline">
                          {e.nome}
                        </button>
                        {iniciativaNome && <p className="truncate text-xs text-muted-foreground">{iniciativaNome}</p>}
                      </TableCell>
                      <TableCell>{e.responsavel}</TableCell>
                      <TableCell className="tabular-nums">{formatDate(e.dataTermino)}</TableCell>
                      <TableCell className={cn('font-medium', TONE_TEXT[d.tone])}>{d.label}</TableCell>
                      <TableCell>
                        <StatusBadge status={effectiveStatus(e)} />
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
  )
}
