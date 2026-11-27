import type { Metadata } from 'next'
import { PageTitle } from '@/components/page-title'
import { DashboardOverview } from '@/components/dashboard-overview'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = { title: 'Dashboard' }

export default function DashboardPage() {
  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-5">
      <PageTitle
        title="Dashboard"
        description="Visão consolidada dos KRs em farol amarelo e vermelho. Os cards mostram a situação global; a tabela respeita as permissões do seu perfil."
      />
      <DashboardOverview />
    </main>
  )
}