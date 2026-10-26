'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

interface IconActionProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label: string
  destructive?: boolean
}

export function IconAction({ label, destructive, className, children, ...props }: IconActionProps) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={cn(
        'inline-flex size-8 items-center justify-center rounded-md text-ink-soft transition-colors',
        'hover:bg-line/10 hover:text-ink',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal/40',
        destructive && 'hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/20 dark:hover:text-rose-400',
        '[&_svg]:size-4',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}