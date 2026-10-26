'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

interface Option {
  value: string
  label: string
}

interface OptionSelectProps {
  id?: string
  value: string
  onValueChange: (value: string) => void
  options: Option[]
  size?: 'default' | 'sm'
  invalid?: boolean
  ariaLabel?: string
}

export function OptionSelect({
  id,
  value,
  onValueChange,
  options,
  size = 'default',
  invalid,
  ariaLabel,
}: OptionSelectProps) {
  return (
    <select
      id={id}
      aria-label={ariaLabel}
      aria-invalid={invalid || undefined}
      value={value}
      onChange={(e) => onValueChange(e.target.value)}
      className={cn(
        'w-full rounded-md border bg-panel text-ink transition-colors',
        'focus:outline-none focus:ring-2 focus:ring-teal/40 focus:border-teal',
        'disabled:cursor-not-allowed disabled:opacity-50',
        size === 'sm' ? 'h-8 px-2 text-xs' : 'h-9 px-3 text-sm',
        invalid ? 'border-rose-500' : 'border-line',
      )}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  )
}