// components/filters-bar.tsx
'use client'

import { FilterXIcon } from 'lucide-react'
import { OptionSelect } from '@/components/option-select'
import { usePlan } from '@/components/plan-provider'
import { Button } from '@/components/button'
import { STATUS_META, STATUS_ORDER } from '@/lib/plan-utils'

export function FiltersBar() {
  const { filters, setFilters, resetFilters, hasActiveFilters, strategic_perspectives, setores, responsaveis, filtered, rows } = usePlan()

  const field = 'flex flex-col gap-1.5'
  const label = 'text-xs font-medium text-ink'
  const input = 'h-9 w-full rounded-md border border-line bg-panel px-3 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-teal/40 focus:border-teal'

  return (
    <section aria-label="Filtros" className="rounded-lg border border-line bg-panel p-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
        <div className={field}>
          <label htmlFor="f-strategic_perspective" className={label}>Perspectiva estratégica</label>
          <OptionSelect
            id="f-strategic_perspective"
            value={filters.strategic_perspective}
            onValueChange={(v) => setFilters((f) => ({ ...f, strategic_perspective: v }))}
            options={[{ value: 'todas', label: 'Todas as perspectivas' }, ...strategic_perspectives.map((p) => ({ value: p, label: p }))]}
          />
        </div>
        <div className={field}>
          <label htmlFor="f-setor" className={label}>Setor</label>
          <OptionSelect
            id="f-setor"
            value={filters.setor}
            onValueChange={(v) => setFilters((f) => ({ ...f, setor: v }))}
            options={[{ value: 'todos', label: 'Todos os setores' }, ...setores.map((s) => ({ value: s, label: s }))]}
          />
        </div>
        <div className={field}>
          <label htmlFor="f-responsavel" className={label}>Resp. da etapa</label>
          <OptionSelect
            id="f-responsavel"
            value={filters.responsavel}
            onValueChange={(v) => setFilters((f) => ({ ...f, responsavel: v }))}
            options={[{ value: 'todos', label: 'Todos os responsáveis' }, ...responsaveis.map((r) => ({ value: r, label: r }))]}
          />
        </div>
        <div className={field}>
          <label htmlFor="f-status" className={label}>Status</label>
          <OptionSelect
            id="f-status"
            value={filters.status}
            onValueChange={(v) => setFilters((f) => ({ ...f, status: v }))}
            options={[
              { value: 'todos', label: 'Todos os status' },
              ...STATUS_ORDER.map((s) => ({ value: s, label: STATUS_META[s].label })),
            ]}
          />
        </div>
        <div className={field}>
          <label htmlFor="f-de" className={label}>Término de</label>
          <input id="f-de" type="date" value={filters.de} onChange={(e) => setFilters((f) => ({ ...f, de: e.target.value }))} className={input} />
        </div>
        <div className={field}>
          <label htmlFor="f-ate" className={label}>Término até</label>
          <input id="f-ate" type="date" value={filters.ate} onChange={(e) => setFilters((f) => ({ ...f, ate: e.target.value }))} className={input} />
        </div>
        <div className="flex items-end">
          <Button variant="outline" className="w-full" onClick={resetFilters} disabled={!hasActiveFilters}>
            <FilterXIcon className="size-4" />
            Limpar filtros
          </Button>
        </div>
      </div>
      <p className="mt-3 text-xs text-ink-soft" aria-live="polite">
        Exibindo <span className="font-medium text-ink">{filtered.length}</span> de {rows.length} etapas
      </p>
    </section>
  )
}