'use client'

import * as React from 'react'
import { AlertTriangleIcon } from 'lucide-react'
import { Button } from '@/components/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/dialog'

interface ConfirmDeleteProps {
  open: boolean
  title: string
  description: string
  onCancel: () => void
  onConfirm: () => void
  confirmLabel?: string
}

export function ConfirmDelete({
  open,
  title,
  description,
  onCancel,
  onConfirm,
  confirmLabel = 'Excluir',
}: ConfirmDeleteProps) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onCancel()}>
      <DialogContent className="w-[min(90vw,28rem)]" showClose={false}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangleIcon className="size-5 text-rose-500" />
            {title}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button variant="destructive" onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}