'use client'

import { PlusIcon } from 'lucide-react'
import { usePlan } from '@/components/plan-provider'
import { Button } from '@/components/ui/button'

export function NewIniciativaButton() {
  const { openIniciativaForm } = usePlan()
  return (
    <Button onClick={() => openIniciativaForm()}>
      <PlusIcon data-icon="inline-start" />
      Nova iniciativa
    </Button>
  )
}
