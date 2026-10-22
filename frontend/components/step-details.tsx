import { ProgressBar } from '@/components/progress-bar'
import { StatusBadge } from '@/components/status-badge'
import { TONE_TEXT, deadlineInfo, effectiveStatus, formatDate } from '@/lib/plan-utils'
import type { EtapaRow } from '@/lib/types'
import { cn } from '@/lib/utils'

function Item({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('flex flex-col gap-1', className)}>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-sm">{children}</dd>
    </div>
  )
}

export function StepDetails({ etapa }: { etapa: EtapaRow }) {
  const status = effectiveStatus(etapa)
  const deadline = deadlineInfo(etapa)
  const tone = status === 'atrasado' ? 'danger' : status === 'concluido' ? 'success' : 'info'

  return (
    <dl className="grid gap-x-4 gap-y-4 sm:grid-cols-2">
      <Item label="Iniciativa estratégica" className="sm:col-span-2">
        {etapa.iniciativa.nome}
      </Item>
      <Item label="KR" className="sm:col-span-2">
        {etapa.kr.nome}
        <span className="block text-xs text-muted-foreground">Setor: {etapa.kr.setor || '—'}</span>
      </Item>
      <Item label="Nº">{etapa.numero}</Item>
      <Item label="Responsável pela etapa">{etapa.responsavel}</Item>
      <Item label="Nome da etapa" className="sm:col-span-2">
        {etapa.nome}
      </Item>
      <Item label="Status">
        <StatusBadge status={status} />
      </Item>
      <Item label="Situação do prazo">
        <span className={cn('font-medium', TONE_TEXT[deadline.tone])}>{deadline.label}</span>
      </Item>
      <Item label="Previsto">
        <ProgressBar value={etapa.previsto} tone="muted" showLabel label="Percentual previsto" />
      </Item>
      <Item label="Realizado">
        <ProgressBar value={etapa.realizado} tone={tone} showLabel label="Percentual realizado" />
      </Item>
      <Item label="Data início">{formatDate(etapa.dataInicio)}</Item>
      <Item label="Data término">{formatDate(etapa.dataTermino)}</Item>
    </dl>
  )
}
