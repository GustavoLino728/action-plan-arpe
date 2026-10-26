export const dynamic = 'force-dynamic'

import { PageTitle } from '@/components/page-title'
import { UploadLauncher } from '@/components/upload-launcher'

export const metadata = { title: 'Carga de Planilhas' }

export default function CargaPage() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-5">
      <PageTitle
        title="Carga de Planilhas"
        description="Importe o planejamento estratégico em lote, mapeando as colunas da planilha para a hierarquia do sistema."
      />
      <UploadLauncher />
    </main>
  )
}