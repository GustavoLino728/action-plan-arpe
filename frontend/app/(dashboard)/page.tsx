export const dynamic = 'force-dynamic'

import { FiltersBar } from '@/components/filters-bar'
import { KpiCards } from '@/components/kpi-cards'
import { NewObjectiveButton } from '@/components/new-objective-button'
import { NewPerspectiveButton } from '@/components/new-perspective-button'
import { PageTitle } from '@/components/page-title'
import { TreeView } from '@/components/tree-view'

export default function MapaEstrategicoPage() {
  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-5">
      <PageTitle
        title="Mapa Estratégico"
        description="Acompanhe a execução do planejamento estratégico por perspectiva, objetivo, iniciativa e etapa."
        actions={
          <div className="flex flex-wrap gap-2">
            <NewPerspectiveButton />
            <NewObjectiveButton />
          </div>
        }
      />
      <KpiCards />
      <FiltersBar />
      <TreeView />
    </main>
  )
}