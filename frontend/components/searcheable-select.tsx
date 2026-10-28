'use client'

import * as React from 'react'
import { Check, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface Option {
  value: string
  label: string
}

interface SearchableSelectProps {
  id?: string
  value: string
  onValueChange: (value: string) => void
  options: Option[]
  placeholder?: string
  size?: 'default' | 'sm'
  invalid?: boolean
  ariaLabel?: string
}

export function SearchableSelect({
  id,
  value,
  onValueChange,
  options,
  placeholder = 'Selecione...',
  size = 'default',
  invalid,
  ariaLabel,
}: SearchableSelectProps) {
  const [open, setOpen] = React.useState(false)
  const [query, setQuery] = React.useState('')
  const containerRef = React.useRef<HTMLDivElement>(null)
  const inputRef = React.useRef<HTMLInputElement>(null)

  const selectedOption = options.find((opt) => opt.value === value)
  const selectedLabel = selectedOption?.label || ''

  const filteredOptions =
    query === ''
      ? options
      : options.filter((opt) =>
          opt.label.toLowerCase().includes(query.toLowerCase())
        )

  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
        setQuery('')
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleFocus = () => {
    setOpen(true)
    setQuery('')
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value)
    setOpen(true)
  }

  const handleSelect = (optionValue: string) => {
    onValueChange(optionValue)
    setOpen(false)
    setQuery('')
  }

  const displayValue = open ? query : selectedLabel

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <input
          ref={inputRef}
          id={id}
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-controls="options-list"
          aria-label={ariaLabel}
          value={displayValue}
          onChange={handleChange}
          onFocus={handleFocus}
          onClick={() => setOpen(true)}
          placeholder={placeholder}
          autoComplete="off"
          className={cn(
            'w-full rounded-md border bg-panel text-ink transition-colors',
            'focus:outline-none focus:ring-2 focus:ring-teal/40 focus:border-teal',
            'disabled:cursor-not-allowed disabled:opacity-50',
            size === 'sm' ? 'h-8 px-2 text-xs' : 'h-9 px-3 text-sm',
            invalid ? 'border-rose-500' : 'border-line',
          )}
        />
        <button
          type="button"
          tabIndex={-1}
          onClick={() => {
            if (open) {
              setOpen(false)
            } else {
              setOpen(true)
              inputRef.current?.focus()
            }
          }}
          className="absolute inset-y-0 right-0 flex items-center pr-2"
          aria-label="Abrir opções"
        >
          <ChevronDown className="size-4 text-ink-soft" aria-hidden />
        </button>
      </div>
      {open && (
        <ul
          id="options-list"
          role="listbox"
          className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border border-line bg-panel py-1 text-sm shadow-lg"
        >
          {filteredOptions.length === 0 ? (
            <li className="px-3 py-2 text-ink-soft">Nenhum resultado.</li>
          ) : (
            filteredOptions.map((option) => (
              <li
                key={option.value}
                role="option"
                aria-selected={option.value === value}
                onClick={() => handleSelect(option.value)}
                className={cn(
                  'relative cursor-pointer select-none px-3 py-2',
                  option.value === value ? 'bg-teal/10 text-teal' : 'text-ink hover:bg-line/10'
                )}
              >
                <span className={cn('block truncate', option.value === value && 'font-medium')}>
                  {option.label}
                </span>
                {option.value === value && (
                  <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-teal">
                    <Check className="size-4" aria-hidden />
                  </span>
                )}
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  )
}