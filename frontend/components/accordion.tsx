// components/accordion.tsx
'use client'

import * as React from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AccordionCtx {
  value: string[]
  toggle: (v: string) => void
}
const Ctx = React.createContext<AccordionCtx | null>(null)

export function Accordion({
  value,
  onValueChange,
  multiple = false,
  children,
  className,
}: {
  value: string[]
  onValueChange: (next: string[]) => void
  multiple?: boolean
  children: React.ReactNode
  className?: string
}) {
  const toggle = (v: string) => {
    if (multiple) {
      const set = new Set(value)
      if (set.has(v)) set.delete(v)
      else set.add(v)
      onValueChange([...set])
    } else {
      onValueChange(value[0] === v ? [] : [v])
    }
  }
  return <Ctx.Provider value={{ value, toggle }}><div className={cn('flex flex-col', className)}>{children}</div></Ctx.Provider>
}

const ItemCtx = React.createContext<{ open: boolean; id: string } | null>(null)

export function AccordionItem({ value, children, className }: { value: string; children: React.ReactNode; className?: string }) {
  const ctx = React.useContext(Ctx)
  if (!ctx) throw new Error('AccordionItem precisa de Accordion')
  const open = ctx.value.includes(value)
  return <ItemCtx.Provider value={{ open, id: value }}><div className={className}>{children}</div></ItemCtx.Provider>
}

export function AccordionTrigger({ children, className }: { children: React.ReactNode; className?: string }) {
  const item = React.useContext(ItemCtx)
  const ctx = React.useContext(Ctx)
  if (!item || !ctx) throw new Error('AccordionTrigger precisa de AccordionItem')
  return (
    <button
      type="button"
      aria-expanded={item.open}
      onClick={() => ctx.toggle(item.id)}
      className={cn('flex w-full items-center justify-between gap-2 text-left cursor-pointer bg-transparent border-none', className)}
    >
      {children}
      <ChevronDown className={cn('size-4 shrink-0 text-ink-soft transition-transform', item.open && 'rotate-180')} aria-hidden />
    </button>
  )
}

export function AccordionContent({ children, className }: { children: React.ReactNode; className?: string }) {
  const item = React.useContext(ItemCtx)
  if (!item || !item.open) return null
  return <div className={className}>{children}</div>
}