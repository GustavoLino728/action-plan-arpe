import * as React from 'react'
import { cn } from '@/lib/utils'

export function Empty({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('flex flex-col items-center justify-center gap-4 p-8 text-center', className)}
      {...props}
    />
  )
}

export function EmptyHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex flex-col items-center gap-2', className)} {...props} />
}

export function EmptyMedia({
  variant = 'default',
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { variant?: 'default' | 'icon' }) {
  return (
    <div
      className={cn(
        'flex items-center justify-center text-ink-soft',
        variant === 'icon' && 'size-12 rounded-full bg-line/20 [&>svg]:size-6',
        className,
      )}
      {...props}
    />
  )
}

export function EmptyTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn('text-base font-semibold text-ink', className)} {...props} />
}

export function EmptyDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn('max-w-md text-sm text-pretty text-ink-soft', className)} {...props} />
  )
}