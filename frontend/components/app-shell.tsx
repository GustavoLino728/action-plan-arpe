'use client'

import { AppHeader } from '@/components/app-header'
import { AppSidebar } from '@/components/app-sidebar'
import { IniciativaFormDialog } from '@/components/iniciativa-form-dialog'
import { KrFormDialog } from '@/components/kr-form-dialog'
import { PlanProvider } from '@/components/plan-provider'
import { StepDrawer } from '@/components/step-drawer'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { Toaster } from '@/components/ui/sonner'
import { UploadDialog } from '@/components/upload-dialog'

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <PlanProvider>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset className="min-w-0">
          <AppHeader />
          <div className="flex-1 p-4 sm:p-6">{children}</div>
        </SidebarInset>
        <StepDrawer />
        <IniciativaFormDialog />
        <KrFormDialog />
        <UploadDialog />
        <Toaster richColors position="bottom-right" />
      </SidebarProvider>
    </PlanProvider>
  )
}
