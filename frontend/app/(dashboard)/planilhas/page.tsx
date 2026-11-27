import type { Metadata } from 'next'
import { PageTitle } from '@/components/page-title'
import { UploadLauncher } from '@/components/upload-launcher'
import { ImportHistoryTable } from '@/components/import-history-table'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = { title: 'Carga de Planilhas' }

export default function PlanilhasPage() {
  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-5">
      <PageTitle
        title="Carga de Planilhas"
        description="Importe planilhas .xlsx com as abas PA 01, PA 02, etc. A aba Mapa Estratégico é ignorada automaticamente."
        actions={<UploadLauncher />}
      />
      <ImportHistoryTable />
    </main>
  )
}