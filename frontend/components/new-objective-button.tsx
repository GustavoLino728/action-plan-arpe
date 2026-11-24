'use client'

import { PlusIcon } from 'lucide-react'
import { usePlan } from '@/components/plan-provider'
import { PermissionedButton } from '@/components/permissioned-button'
import { canManageObjectives } from '@/lib/roles'

export function NewObjectiveButton() {
  const { openObjectiveForm } = usePlan()
  return (
    <PermissionedButton
      variant="outline"
      onClick={() => openObjectiveForm()}
      check={canManageObjectives}
      reason="Apenas administradores, diretores e membros do CGRP podem criar objetivos."
    >
      <PlusIcon className="size-4" />
      Novo objetivo
    </PermissionedButton>
  )
}