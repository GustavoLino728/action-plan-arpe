'use client'

import { FilterXIcon } from 'lucide-react'
import { OptionSelect } from '@/components/option-select'
import { usePlan } from '@/components/plan-provider'
import { Button } from '@/components/ui/button'
import { Field, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { STATUS_META, STATUS_ORDER } from '@/lib/plan-utils'

export function FiltersBar() {
  const { filters, setFilters, resetFilters, hasActiveFilters, strategic_perspectives, setores, responsaveis, filtered, rows } = usePlan()

  return (
    <section aria-label="Filtros" className="rounded-lg border bg-card p-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
        <Field>
          <FieldLabel htmlFor="f-strategic_perspective">Perspectiva estratégica</FieldLabel>
          <OptionSelect
            id="f-strategic_perspective"
            value={filters.strategic_perspective}
            onValueChange={(v) => setFilters((f) => ({ ...f, strategic_perspective: v }))}
            options={[{ value: 'todas', label: 'Todas as perspectivas estratégicas' }, ...strategic_perspectives.map((p) => ({ value: p, label: p }))]}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="f-setor">Setor</FieldLabel>
          <OptionSelect
            id="f-setor"
            value={filters.setor}
            onValueChange={(v) => setFilters((f) => ({ ...f, setor: v }))}
            options={[{ value: 'todos', label: 'Todos os setores' }, ...setores.map((s) => ({ value: s, label: s }))]}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="f-responsavel">Resp. da etapa</FieldLabel>
          <OptionSelect
            id="f-responsavel"
            value={filters.responsavel}
            onValueChange={(v) => setFilters((f) => ({ ...f, responsavel: v }))}
            options={[{ value: 'todos', label: 'Todos os responsáveis' }, ...responsaveis.map((r) => ({ value: r, label: r }))]}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="f-status">Status</FieldLabel>
          <OptionSelect
            id="f-status"
            value={filters.status}
            onValueChange={(v) => setFilters((f) => ({ ...f, status: v }))}
            options={[
              { value: 'todos', label: 'Todos os status' },
              ...STATUS_ORDER.map((s) => ({ value: s, label: STATUS_META[s].label })),
            ]}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="f-de">Término de</FieldLabel>
          <Input id="f-de" type="date" value={filters.de} onChange={(e) => setFilters((f) => ({ ...f, de: e.target.value }))} />
        </Field>
        <Field>
          <FieldLabel htmlFor="f-ate">Término até</FieldLabel>
          <Input id="f-ate" type="date" value={filters.ate} onChange={(e) => setFilters((f) => ({ ...f, ate: e.target.value }))} />
        </Field>
        <div className="flex items-end">
          <Button variant="outline" className="w-full" onClick={resetFilters} disabled={!hasActiveFilters}>
            <FilterXIcon data-icon="inline-start" />
            Limpar filtros
          </Button>
        </div>
      </div>
      <p className="mt-3 text-xs text-muted-foreground" aria-live="polite">
        Exibindo <span className="font-medium text-foreground">{filtered.length}</span> de {rows.length} etapas
      </p>
    </section>
  )
}
