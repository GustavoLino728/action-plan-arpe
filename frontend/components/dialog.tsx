'use client'

import * as React from 'react'
import { XIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface DialogContextValue {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const DialogContext = React.createContext<DialogContextValue | null>(null)

export function Dialog({
  open,
  onOpenChange,
  children,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: React.ReactNode
}) {
  const dialogRef = React.useRef<HTMLDialogElement>(null)
  const closingRef = React.useRef(false)

  React.useEffect(() => {
    const el = dialogRef.current
    if (!el) return
    if (open && !el.open) {
      el.showModal()
    } else if (!open && el.open) {
      closingRef.current = true
      el.close()
    }
  }, [open])

  const handleClose = () => {
    if (closingRef.current) {
      closingRef.current = false
      return
    }
    onOpenChange(false)
  }

  return (
    <dialog
      ref={dialogRef}
      onClose={handleClose}
      onClick={(e) => {
        if (e.target === dialogRef.current) onOpenChange(false)
      }}
      className="rounded-lg border border-line bg-panel text-ink shadow-xl p-0 backdrop:bg-black/50"
    >
      <DialogContext.Provider value={{ open, onOpenChange }}>
        {children}
      </DialogContext.Provider>
    </dialog>
  )
}

export function DialogContent({
  children,
  className,
  showClose = true,
}: {
  children: React.ReactNode
  className?: string
  showClose?: boolean
}) {
  const ctx = React.useContext(DialogContext)
  return (
    <div className={cn('relative flex max-h-[85vh] w-[min(90vw,42rem)] flex-col gap-4 overflow-hidden p-6', className)}>
      {showClose && (
        <button
          type="button"
          aria-label="Fechar"
          onClick={() => ctx?.onOpenChange(false)}
          className="absolute top-3 right-3 rounded-md p-1 text-ink-soft hover:bg-line/10 hover:text-ink"
        >
          <XIcon className="size-4" />
        </button>
      )}
      {children}
    </div>
  )
}

export function DialogHeader({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('flex flex-col gap-1.5 pr-8', className)}>{children}</div>
}

export function DialogTitle({ children, className }: { children: React.ReactNode; className?: string }) {
  return <h2 className={cn('text-lg font-semibold text-ink', className)}>{children}</h2>
}

export function DialogDescription({ children, className }: { children: React.ReactNode; className?: string }) {
  return <p className={cn('text-sm text-ink-soft', className)}>{children}</p>
}

export function DialogFooter({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('flex flex-wrap items-center justify-end gap-2 border-t border-line pt-4', className)}>{children}</div>
}