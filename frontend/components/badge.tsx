import * as React from 'react'
import { cn } from '@/lib/utils'

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'outline'
}

export function Badge({ variant = 'default', className, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-medium whitespace-nowrap',
        variant === 'default' && 'border-transparent bg-teal text-white',
        variant === 'outline' && 'border-line bg-panel text-ink-soft',
        className,
      )}
      {...props}
    />
  )
}