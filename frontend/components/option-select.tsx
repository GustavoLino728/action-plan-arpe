'use client'

import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'

export interface Option {
  value: string
  label: string
}

export function OptionSelect({
  value,
  onValueChange,
  options,
  placeholder,
  className,
  size = 'default',
  id,
  ariaLabel,
  invalid,
}: {
  value: string
  onValueChange: (value: string) => void
  options: Option[]
  placeholder?: string
  className?: string
  size?: 'sm' | 'default'
  id?: string
  ariaLabel?: string
  invalid?: boolean
}) {
  return (
    <Select items={options} value={value} onValueChange={(v) => onValueChange(v ?? '')}>
      <SelectTrigger id={id} size={size} aria-label={ariaLabel} aria-invalid={invalid} className={cn('w-full', className)}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent alignItemWithTrigger={false}>
        <SelectGroup>
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  )
}
