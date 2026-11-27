'use client'

import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Tone } from '@/lib/plan-utils'

const TONE_CARD: Record<Tone, string> = {
  success: 'border-success/25 bg-success/5',
  warning: 'border-warning/30 bg-warning/5',
  danger: 'border-danger/25 bg-danger/5',
  muted: 'border-border bg-muted/30',
  info: 'border-info/25 bg-info/5',
  gold: 'border-gold/40 bg-gold/10',
}

const TONE_NUMBER: Record<Tone, string> = {
  success: 'text-success',
  warning: 'text-warning',
  danger: 'text-danger',
  muted: 'text-muted-foreground',
  info: 'text-info',
  gold: 'text-foreground',
}

interface Props {
  label: string
  count: number
  tone: Tone
  icon?: LucideIcon
  hint?: string
}

export function FarolCard({ label, count, tone, icon: Icon, hint }: Props) {
  return (
    <div className={cn('rounded-custom border p-4 flex flex-col gap-1', TONE_CARD[tone])}>
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-medium uppercase tracking-wide text-ink-soft">
          {label}
        </span>
        {Icon ? <Icon className={cn('size-4', TONE_NUMBER[tone])} /> : null}
      </div>
      <span className={cn('text-[28px] leading-tight font-semibold tabular-nums', TONE_NUMBER[tone])}>
        {count.toLocaleString('pt-BR')}
      </span>
      {hint ? <span className="text-[11px] text-ink-soft">{hint}</span> : null}
    </div>
  )
}