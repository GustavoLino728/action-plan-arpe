'use client'

import * as React from 'react'
import { FilterXIcon } from 'lucide-react'
import { SearchableSelect } from '@/components/searcheable-select'
import { Button } from '@/components/button'
import { STATUS_META, STATUS_ORDER } from '@/lib/plan-utils'
import type { CalendarFiltersState, CalendarLayer } from '@/lib/calendar-utils'
import type { ApiDepartment } from '@/lib/api/services'

const LAYER_LABELS: { key: CalendarLayer; label: string }[] = [
  { key: 'etapa', label: 'Etapas' },
  { key: 'kr', label: 'KRs' },
  { key: 'geral', label: 'Visão geral' },
]

interface Props {
  filters: CalendarFiltersState
  onChange: (next: CalendarFiltersState) => void
  departments: ApiDepartment[]
  perspectives: string[]
  responsibles: string[]
  showDepartment: boolean
}

export function CalendarFilters({
  filters,
  onChange,
  departments,
  perspectives,
  responsibles,
  showDepartment,
}: Props) {
  function toggleLayer(layer: CalendarLayer) {
    const next = new Set(filters.layers)
    if (next.has(layer)) next.delete(layer)
    else next.add(layer)
    onChange({ ...filters, layers: next })
  }

  const hasActive =
    filters.departmentId !== 'todos' ||
    filters.perspective !== 'todas' ||
    filters.status !== 'todos' ||
    filters.responsible !== 'todos'

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-line bg-panel p-4">
      {/* Camadas */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-ink">Camadas:</span>
        {LAYER_LABELS.map(({ key, label }) => {
          const active = filters.layers.has(key)
          return (
            <button
              key={key}
              type="button"
              onClick={() => toggleLayer(key)}
              className={`rounded-md border px-2.5 py-1 text-xs font-medium transition-colors ${
                active
                  ? 'border-teal bg-teal/10 text-teal'
                  : 'border-line bg-panel text-ink-soft hover:bg-line/10'
              }`}
              aria-pressed={active}
            >
              {active ? '✓ ' : ''}{label}
            </button>
          )
        })}
      </div>

      {/* Filtros */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {showDepartment && (
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-ink">Setor</label>
            <SearchableSelect
              value={filters.departmentId}
              onValueChange={(v) => onChange({ ...filters, departmentId: v })}
              options={[
                { value: 'todos', label: 'Todos os setores' },
                ...departments.map((d) => ({
                  value: d.id,
                  label: d.acronym ? `${d.acronym} — ${d.name}` : d.name,
                })),
              ]}
              placeholder="Buscar setor..."
            />
          </div>
        )}

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-ink">Perspectiva</label>
          <SearchableSelect
            value={filters.perspective}
            onValueChange={(v) => onChange({ ...filters, perspective: v })}
            options={[
              { value: 'todas', label: 'Todas' },
              ...perspectives.map((p) => ({ value: p, label: p })),
            ]}
            placeholder="Buscar..."
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-ink">Status</label>
          <SearchableSelect
            value={filters.status}
            onValueChange={(v) => onChange({ ...filters, status: v as CalendarFiltersState['status'] })}
            options={[
              { value: 'todos', label: 'Todos' },
              ...STATUS_ORDER.map((s) => ({ value: s, label: STATUS_META[s].label })),
            ]}
            placeholder="Buscar..."
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-ink">Responsável</label>
          <SearchableSelect
            value={filters.responsible}
            onValueChange={(v) => onChange({ ...filters, responsible: v })}
            options={[
              { value: 'todos', label: 'Todos' },
              ...responsibles.map((r) => ({ value: r, label: r })),
            ]}
            placeholder="Buscar..."
          />
        </div>

        <div className="flex items-end">
          <Button
            variant="outline"
            className="w-full"
            onClick={() =>
              onChange({
                ...filters,
                departmentId: 'todos',
                perspective: 'todas',
                status: 'todos',
                responsible: 'todos',
              })
            }
            disabled={!hasActive}
          >
            <FilterXIcon className="size-4" />
            Limpar
          </Button>
        </div>
      </div>
    </div>
  )
}