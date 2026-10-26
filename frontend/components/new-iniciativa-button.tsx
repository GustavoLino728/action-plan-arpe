'use client'

import { PlusIcon } from 'lucide-react'
import { usePlan } from '@/components/plan-provider'
import { Button } from '@/components/button'

export function NewIniciativaButton() {
  const { openIniciativaForm } = usePlan()
  return (
    <Button onClick={() => openIniciativaForm()}>
      <PlusIcon className="size-4" />
      Nova iniciativa
    </Button>
  )
}