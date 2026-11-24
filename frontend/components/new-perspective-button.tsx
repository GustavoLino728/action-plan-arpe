'use client'

import { PlusIcon } from 'lucide-react'
import { usePlan } from '@/components/plan-provider'
import { PermissionedButton } from '@/components/permissioned-button'
import { canManagePerspectives } from '@/lib/roles'

export function NewPerspectiveButton() {
  const { openPerspectiveForm } = usePlan()
  return (
    <PermissionedButton
      variant="outline"
      onClick={() => openPerspectiveForm()}
      check={canManagePerspectives}
      reason="Apenas administradores, diretores e membros do CGRP podem criar perspectivas."
    >
      <PlusIcon className="size-4" />
      Nova perspectiva
    </PermissionedButton>
  )
}