'use client'

import { PlusIcon } from 'lucide-react'
import { usePlan } from '@/components/plan-provider'
import { PermissionedButton } from '@/components/permissioned-button'
import { canManageInitiatives } from '@/lib/roles'

export function NewIniciativaButton() {
  const { openIniciativaForm } = usePlan()
  return (
    <PermissionedButton
      onClick={() => openIniciativaForm()}
      check={canManageInitiatives}
      reason="Apenas administradores, diretores e membros do CGRP podem criar iniciativas."
    >
      <PlusIcon className="size-4" />
      Nova iniciativa
    </PermissionedButton>
  )
}