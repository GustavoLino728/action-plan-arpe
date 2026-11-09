'use client'

import { PlusIcon } from 'lucide-react'
import { usePlan } from '@/components/plan-provider'
import { Button } from '@/components/button'

export function NewPerspectiveButton() {
  const { openPerspectiveForm } = usePlan()
  return (
    <Button variant="outline" onClick={() => openPerspectiveForm()}>
      <PlusIcon className="size-4" />
      Nova perspectiva
    </Button>
  )
}