import { cn } from '@/lib/utils'

export function ArpeMark({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        'relative inline-flex size-9 shrink-0 items-center justify-center rounded-md bg-white font-bold tracking-tight text-[#0f2b5c] shadow-sm',
        className,
      )}
    >
      <span className="text-sm">AR</span>
      <span className="absolute inset-x-1.5 bottom-1 h-0.5 rounded-full bg-[#d99b26]" />
    </span>
  )
}

export function ArpeLogo({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <ArpeMark />
      <div className="flex min-w-0 flex-col leading-tight">
        <span className="text-sm font-semibold tracking-wide">ARPE</span>
        <span className="truncate text-[11px] opacity-80">Governo do Estado de Pernambuco</span>
      </div>
    </div>
  )
}
