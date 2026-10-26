// components/status-badge.tsx
import * as React from 'react'
import { cn } from '@/lib/utils'
import { STATUS_META, TONE_CLASSES, type Tone } from '@/lib/plan-utils'
import type { Status } from '@/lib/types'

export function ToneBadge({
  tone,
  children,
  className,
}: {
  tone: Tone
  children: React.ReactNode
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[11px] font-medium',
        TONE_CLASSES[tone],
        className,
      )}
    >
      {children}
    </span>
  )
}

export function StatusBadge({
  status,
  className,
}: {
  status: Status
  className?: string
}) {
  const meta = STATUS_META[status]
  return (
    <ToneBadge tone={meta.tone} className={className}>
      {meta.label}
    </ToneBadge>
  )
}