import * as React from 'react'
import { cn } from '@/lib/utils'
import { TONE_BAR, type Tone } from '@/lib/plan-utils'

interface ProgressBarProps {
  value: number
  tone?: Tone
  showLabel?: boolean
  label?: string
  className?: string
}

export function ProgressBar({
  value,
  tone = 'info',
  showLabel = false,
  label,
  className,
}: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, value))
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label}
        className="h-1.5 flex-1 overflow-hidden rounded-full bg-line"
      >
        <div
          className={cn('h-full rounded-full transition-all duration-300', TONE_BAR[tone])}
          style={{ width: `${clamped}%` }}
        />
      </div>
      {showLabel && (
        <span className="w-9 shrink-0 text-right text-xs tabular-nums text-ink-soft">
          {Math.round(clamped)}%
        </span>
      )}
    </div>
  )
}