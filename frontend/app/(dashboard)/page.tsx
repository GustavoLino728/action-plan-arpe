export const dynamic = 'force-dynamic'

import { FiltersBar } from '@/components/filters-bar'
import { KpiCards } from '@/components/kpi-cards'
import { PageTitle } from '@/components/page-title'
import { TreeView } from '@/components/tree-view'

export default function MapaEstrategicoPage() {
  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-5">
      <PageTitle
        title="Mapa Estratégico"
        description="Acompanhe a execução do planejamento estratégico por perspectiva, objetivo, iniciativa e etapa."
      />
      <KpiCards />
      <FiltersBar />
      <TreeView />
    </main>
  )
}