'use client'

import { CalendarIcon, UserIcon } from 'lucide-react'
import { usePlan } from '@/components/plan-provider'
import { ProgressBar } from '@/components/progress-bar'
import { StatusBadge, ToneBadge } from '@/components/status-badge'
import { TONE_TEXT, deadlineInfo, effectiveStatus, formatDate } from '@/lib/plan-utils'
import type { EtapaRow as EtapaRowData } from '@/lib/types'
import { cn } from '@/lib/utils'

export const ETAPA_GRID = 'lg:grid-cols-[minmax(0,1fr)_9rem_10rem_8rem_10rem]'

export function EtapaRowHeader() {
  return (
    <div className={cn('hidden px-3 pb-1 text-[11px] font-medium tracking-wide text-muted-foreground uppercase lg:grid lg:gap-4', ETAPA_GRID)}>
      <span>Etapa</span>
      <span>Responsável</span>
      <span>Término</span>
      <span>Status</span>
      <span>Realizado / previsto</span>
    </div>
  )
}

export function EtapaRow({ etapa }: { etapa: EtapaRowData }) {
  const { openView, justSummary } = usePlan()
  const status = effectiveStatus(etapa)
  const deadline = deadlineInfo(etapa)
  const just = justSummary[etapa.id]
  const missingJustification = status === 'atrasado' && !just

  return (
    <button
      type="button"
      onClick={() => openView(etapa.id, status === 'atrasado' ? 'justificativas' : 'dados')}
      className={cn(
        'grid w-full gap-2 rounded-md border border-transparent px-3 py-2.5 text-left transition-colors outline-none hover:border-border hover:bg-accent/50 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 lg:items-center lg:gap-4',
        ETAPA_GRID,
      )}
      aria-label={`Abrir detalhes da etapa ${etapa.numero}: ${etapa.nome}`}
    >
      <span className="flex min-w-0 items-start gap-2">
        <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded bg-muted text-[11px] font-semibold tabular-nums text-muted-foreground">
          {etapa.numero}
        </span>
        <span className="flex min-w-0 flex-col gap-1">
          <span className="text-sm font-medium text-foreground">{etapa.nome}</span>
          {missingJustification && <ToneBadge tone="danger" className="w-fit">Sem justificativa de atraso</ToneBadge>}
          {just && just.abertas > 0 && status === 'atrasado' && (
            <ToneBadge tone="warning" className="w-fit">
              {just.abertas} {just.abertas === 1 ? 'justificativa aberta' : 'justificativas abertas'}
            </ToneBadge>
          )}
        </span>
      </span>
      <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <UserIcon aria-hidden className="size-3.5 shrink-0" />
        <span className="truncate">{etapa.responsavel}</span>
      </span>
      <span className="flex flex-col text-xs">
        <span className="flex items-center gap-1.5 text-muted-foreground">
          <CalendarIcon aria-hidden className="size-3.5 shrink-0" />
          <span className="tabular-nums">{formatDate(etapa.dataTermino)}</span>
        </span>
        <span className={cn('pl-5 text-[11px] font-medium', TONE_TEXT[deadline.tone])}>{deadline.label}</span>
      </span>
      <span>
        <StatusBadge status={status} />
      </span>
      <span className="flex flex-col gap-0.5">
        <ProgressBar
          value={etapa.realizado}
          tone={status === 'atrasado' ? 'danger' : status === 'concluido' ? 'success' : 'info'}
          showLabel
          label={`Realizado da etapa ${etapa.nome}`}
        />
        <span className="text-[11px] text-muted-foreground tabular-nums">previsto {etapa.previsto}%</span>
      </span>
    </button>
  )
}
