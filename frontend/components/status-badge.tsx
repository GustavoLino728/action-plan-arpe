import { Badge } from '@/components/ui/badge'
import { STATUS_META, TONE_CLASSES, type Tone } from '@/lib/plan-utils'
import type { Status } from '@/lib/types'
import { cn } from '@/lib/utils'

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
    <Badge variant="outline" className={cn('font-medium', TONE_CLASSES[tone], className)}>
      {children}
    </Badge>
  )
}

export function StatusBadge({ status, className }: { status: Status; className?: string }) {
  const meta = STATUS_META[status]
  return (
    <ToneBadge tone={meta.tone} className={className}>
      <span aria-hidden className="size-1.5 rounded-full" style={{ backgroundColor: meta.color }} />
      {meta.label}
    </ToneBadge>
  )
}
