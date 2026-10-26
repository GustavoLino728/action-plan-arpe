'use client'

import * as React from 'react'
import { ProgressBar } from '@/components/progress-bar'
import { ToneBadge } from '@/components/status-bagde'
import { STATUS_META } from '@/lib/plan-utils'
import type { EtapaRow as EtapaRowData } from '@/lib/types'

export function EtapaRowHeader() {
  return (
    <div className="grid grid-cols-[40px_1fr_140px_120px_90px] gap-3 border-y border-line bg-line/10 px-3 py-2 text-[11px] font-medium uppercase tracking-wide text-ink-soft">
      <span>Nº</span>
      <span>Etapa</span>
      <span>Responsável</span>
      <span>Prazo</span>
      <span className="text-right">Status</span>
    </div>
  )
}

export function EtapaRow({ etapa }: { etapa: EtapaRowData }) {
  const meta = STATUS_META[etapa.status]
  return (
    <div className="grid grid-cols-[40px_1fr_140px_120px_90px] items-center gap-3 border-b border-line/60 px-3 py-2 text-sm last:border-b-0 hover:bg-line/5">
      <span className="text-ink-soft tabular-nums">{etapa.numero}</span>
      <div className="flex flex-col gap-0.5 min-w-0">
        <span className="truncate text-ink">{etapa.nome}</span>
        <ProgressBar
          value={etapa.realizado}
          tone={etapa.status === 'concluido' ? 'success' : etapa.status === 'atrasado' ? 'danger' : 'info'}
          showLabel
          className="max-w-[220px]"
          label={`Progresso: ${etapa.nome}`}
        />
      </div>
      <span className="truncate text-ink-soft">{etapa.responsavel}</span>
      <span className="text-xs tabular-nums text-ink-soft">
        {etapa.dataInicio} → {etapa.dataTermino}
      </span>
      <div className="flex justify-end">
        <ToneBadge tone={meta.tone}>{meta.label}</ToneBadge>
      </div>
    </div>
  )
}