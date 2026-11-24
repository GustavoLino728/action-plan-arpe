'use client'

import * as React from 'react'
import { Button } from '@/components/button'
import { useAuth } from '@/components/auth-provider'
import type { UserSession } from '@/lib/api/client'

interface PermissionedButtonProps
  extends React.ComponentPropsWithoutRef<typeof Button> {
  check: (user: UserSession | null) => boolean
  reason: string
}

export function PermissionedButton({
  check,
  reason,
  children,
  ...props
}: PermissionedButtonProps) {
  const { user } = useAuth()
  const allowed = check(user)

  if (allowed) {
    return <Button {...props}>{children}</Button>
  }

  return (
    <span title={reason} className="inline-block cursor-not-allowed">
      <Button {...props} disabled className="pointer-events-none">
        {children}
      </Button>
    </span>
  )
}