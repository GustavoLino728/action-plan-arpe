'use client'

import { PlanProvider } from '@/components/plan-provider'
import { AppShell } from '@/components/app-shell'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <PlanProvider>
      <AppShell>{children}</AppShell>
    </PlanProvider>
  )
}