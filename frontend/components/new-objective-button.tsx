'use client'

import { PlusIcon } from 'lucide-react'
import { usePlan } from '@/components/plan-provider'
import { Button } from '@/components/button'

export function NewObjectiveButton() {
  const { openObjectiveForm } = usePlan()
  return (
    <Button variant="outline" onClick={() => openObjectiveForm()}>
      <PlusIcon className="size-4" />
      Novo objetivo
    </Button>
  )
}