import { TONE_BAR, type Tone } from '@/lib/plan-utils'
import { cn } from '@/lib/utils'

export function ProgressBar({
  value,
  tone = 'info',
  showLabel = false,
  className,
  label,
}: {
  value: number
  tone?: Tone
  showLabel?: boolean
  className?: string
  label?: string
}) {
  const clamped = Math.max(0, Math.min(100, value))
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label ?? 'Progresso'}
        className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted"
      >
        <div className={cn('h-full rounded-full transition-all', TONE_BAR[tone])} style={{ width: `${clamped}%` }} />
      </div>
      {showLabel && (
        <span className="w-9 shrink-0 text-right text-xs font-medium tabular-nums text-muted-foreground">
          {clamped}%
        </span>
      )}
    </div>
  )
}
