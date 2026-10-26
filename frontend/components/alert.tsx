// components/alert.tsx
import * as React from 'react'
import { cn } from '@/lib/utils'

type AlertVariant = 'default' | 'destructive'

interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: AlertVariant
}

export function Alert({ variant = 'default', className, children, ...props }: AlertProps) {
  return (
    <div
      role="alert"
      className={cn(
        'grid w-full grid-cols-[auto_1fr] items-start gap-x-3 gap-y-1 rounded-lg border p-3.5 text-sm',
        variant === 'default' && 'border-line bg-panel text-ink [&>svg]:text-ink-soft [&>svg]:size-4 [&>svg]:mt-0.5',
        variant === 'destructive' &&
          'border-rose-200 bg-rose-50 text-rose-800 [&>svg]:text-rose-500 [&>svg]:size-4 [&>svg]:mt-0.5 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-300 dark:[&>svg]:text-rose-400',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export function AlertTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h5 className={cn('col-start-2 font-medium leading-snug', className)} {...props} />
}

export function AlertDescription({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('col-start-2 text-sm opacity-90', className)} {...props} />
}