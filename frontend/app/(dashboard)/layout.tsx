'use client'

import { Suspense } from 'react'
import { DashboardProvider } from '@/components/dashboard-provider'
import { PlanProvider } from '@/components/plan-provider'
import { Sidebar } from '@/components/sidebar'
import { Topbar } from '@/components/topbar'
import { UploadDialog } from '@/components/upload-dialog'
import { IniciativaForm } from '@/components/iniciativa-forms'
import { KrForm } from '@/components/kr-form'
import { EtapaDrawer } from '@/components/etapa-drawer'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={null}>
      <DashboardProvider>
        <PlanProvider>
          <div className="flex h-screen overflow-hidden bg-bg text-ink transition-colors duration-200">
            <Sidebar />
            <div className="flex h-full min-w-0 flex-1 flex-col">
              <div className="shrink-0 border-b border-line bg-panel px-[30px] pt-[22px] pb-[18px] max-lg:px-[20px] max-md:px-4">
                <Topbar />
              </div>
              <main className="flex-1 overflow-y-auto px-[30px] pb-[60px] max-lg:px-[20px] max-md:px-4 max-md:pb-12">
                {children}
              </main>
            </div>
          </div>
          <IniciativaForm />
          <KrForm />
          <EtapaDrawer />
          <UploadDialog />
        </PlanProvider>
      </DashboardProvider>
    </Suspense>
  )
}