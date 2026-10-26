export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import { FiltersBar } from '@/components/filters-bar'
import { InitiativesTable } from '@/components/initiatives-table'
import { NewIniciativaButton } from '@/components/new-iniciativa-button'
import { PageTitle } from '@/components/page-title'

export const metadata: Metadata = { title: 'Planos de Ação' }

export default function PlanosPage() {
  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-5">
      <PageTitle
        title="Planos de Ação"
        description="Cadastre iniciativas estratégicas. Dentro de cada iniciativa, os setores adicionam KRs e, dentro de cada KR, as etapas com seus prazos e justificativas de atraso."
        actions={<NewIniciativaButton />}
      />
      <FiltersBar />
      <InitiativesTable />
    </main>
  )
}