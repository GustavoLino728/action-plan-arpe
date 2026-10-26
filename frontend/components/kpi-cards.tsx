// components/kpi-cards.tsx
'use client'

import { AlertTriangleIcon, CheckCircle2Icon, ClockIcon, GaugeIcon, TargetIcon } from 'lucide-react'
import { usePlan } from '@/components/plan-provider'
import { TONE_CLASSES, averageProgress, countByStatus, type Tone } from '@/lib/plan-utils'
import { cn } from '@/lib/utils'

export function KpiCards() {
  const { filtered, scopeIniciativas, scopeKrs } = usePlan()
  const counts = countByStatus(filtered)
  const progress = averageProgress(filtered.map((e) => ({ realizado: e.realizado })))
  const pct = (n: number) => (filtered.length ? Math.round((n / filtered.length) * 100) : 0)

  const items: { label: string; value: string; hint: string; tone: Tone; icon: typeof GaugeIcon }[] = [
    { label: 'Iniciativas', value: String(scopeIniciativas.length), hint: `${scopeKrs.length} KRs · ${filtered.length} etapas`, tone: 'muted', icon: TargetIcon },
    { label: 'Progresso geral', value: `${progress}%`, hint: 'média realizada das etapas', tone: 'gold', icon: GaugeIcon },
    { label: 'Concluídas', value: String(counts.concluido), hint: `${pct(counts.concluido)}% das etapas`, tone: 'success', icon: CheckCircle2Icon },
    { label: 'Em andamento', value: String(counts.em_andamento), hint: `${counts.a_iniciar} a iniciar`, tone: 'info', icon: ClockIcon },
    { label: 'Atrasadas', value: String(counts.atrasado), hint: 'requerem justificativa', tone: 'danger', icon: AlertTriangleIcon },
  ]

  return (
    <section aria-label="Indicadores gerais" className="grid grid-cols-2 gap-3 lg:grid-cols-5">
      {items.map((item) => (
        <div key={item.label} className="rounded-lg border border-line bg-panel p-4 shadow-sm">
          <div className="flex items-start justify-between gap-2">
            <div className="flex flex-col gap-0.5">
              <span className="text-xs text-ink-soft">{item.label}</span>
              <span className="text-2xl font-semibold tabular-nums text-ink">{item.value}</span>
              <span className="text-xs text-ink-soft">{item.hint}</span>
            </div>
            <span className={cn('flex size-8 shrink-0 items-center justify-center rounded-md border', TONE_CLASSES[item.tone])}>
              <item.icon aria-hidden className="size-4" />
            </span>
          </div>
        </div>
      ))}
    </section>
  )
}