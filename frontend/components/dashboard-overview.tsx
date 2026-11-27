'use client'

import { AlertTriangleIcon, CircleSlashIcon, ListChecksIcon, RefreshCwIcon } from 'lucide-react'
import * as React from 'react'
import { Button } from '@/components/button'
import { FarolCard } from '@/components/farol-card'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/table'
import { cn } from '@/lib/utils'
import type { Tone } from '@/lib/plan-utils'
import {
  fetchDashboardOverview,
  type DashboardOverview,
  type KrAlert,
} from '@/lib/api/dashboard'

const numberFmt = new Intl.NumberFormat('pt-BR')

const FAROL_LABEL: Record<'verde' | 'amarelo' | 'vermelho', string> = {
  verde: 'Verde',
  amarelo: 'Amarelo',
  vermelho: 'Vermelho',
}

const FAROL_TONE: Record<'verde' | 'amarelo' | 'vermelho', Tone> = {
  verde: 'success',
  amarelo: 'warning',
  vermelho: 'danger',
}

function farolBadgeClasses(farol: KrAlert['farol']) {
  const tone = FAROL_TONE[farol]
  if (tone === 'success') return 'bg-success/10 text-success border-success/25'
  if (tone === 'warning') return 'bg-warning/10 text-warning border-warning/30'
  return 'bg-danger/10 text-danger border-danger/25'
}

function formatDays(n: number) {
  if (n === 0) return 'Hoje'
  if (n > 0) return `${n} ${n === 1 ? 'dia' : 'dias'}`
  return `Atraso ${Math.abs(n)}d`
}

function daysTone(n: number): string {
  if (n < 0) return 'text-danger'
  if (n <= 15) return 'text-warning'
  return 'text-ink-soft'
}

export function DashboardOverview() {
  const [data, setData] = React.useState<DashboardOverview | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  const load = React.useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setData(await fetchDashboardOverview())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar dashboard.')
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    void load()
  }, [load])

  if (loading && !data) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-[90px] rounded-custom border border-line/30 animate-pulse" />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-start gap-2 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-[13px] text-rose-700">
        <AlertTriangleIcon className="size-4 mt-0.5 shrink-0" />
        <span>{error}</span>
      </div>
    )
  }

  if (!data) return null

  const { cards, krs_alerta, scope } = data

  return (
    <div className="flex flex-col gap-5">
      {/* Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <FarolCard label="Total de KRs" count={cards.total_krs} tone="info" hint="Visão global" />
        <FarolCard label="Verde" count={cards.verde} tone="success" />
        <FarolCard label="Amarelo" count={cards.amarelo} tone="warning" />
        <FarolCard label="Vermelho" count={cards.vermelho} tone="danger" />
      </div>

      {/* Contadores auxiliares */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-ink-soft">
        <span className="inline-flex items-center gap-1.5">
          <CircleSlashIcon className="size-3.5" />
          {cards.sem_prazo} sem prazo
        </span>
        <span className="inline-flex items-center gap-1.5">
          <AlertTriangleIcon className="size-3.5" />
          {cards.krs_sem_movimento} sem movimento
        </span>
        <span className="inline-flex items-center gap-1.5">
          <ListChecksIcon className="size-3.5" />
          {cards.steps_atrasadas} etapas atrasadas
        </span>
        <Button
          variant="outline"
          className="ml-auto"
          onClick={() => void load()}
          disabled={loading}
          aria-label="Atualizar dashboard"
        >
          <RefreshCwIcon className={cn('size-4', loading && 'animate-spin')} />
        </Button>
      </div>

      {/* Tabela */}
      <section className="bg-panel border border-line/30 rounded-custom p-5">
        <div className="mb-3">
          <h2 className="text-[14px] font-semibold text-ink">KRs em atenção</h2>
          <p className="text-[12px] text-ink-soft mt-0.5">
            {scope === 'global'
              ? `${krs_alerta.length} ${krs_alerta.length === 1 ? 'KR' : 'KRs'} em amarelo ou vermelho`
              : `Exibindo apenas o seu departamento · ${krs_alerta.length} ${krs_alerta.length === 1 ? 'KR' : 'KRs'}`}
          </p>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Farol</TableHead>
              <TableHead>Coord.</TableHead>
              <TableHead>KR</TableHead>
              <TableHead>Iniciativa</TableHead>
              <TableHead className="text-right">Progresso</TableHead>
              <TableHead className="text-right">Esperado</TableHead>
              <TableHead className="text-right">Desvio</TableHead>
              <TableHead className="text-right">Prazo</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {krs_alerta.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="py-8 text-center text-[13px] text-ink-soft">
                  Nenhum KR em atenção.
                </TableCell>
              </TableRow>
            ) : (
              krs_alerta.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>
                    <span
                      className={cn(
                        'inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium',
                        farolBadgeClasses(row.farol),
                      )}
                    >
                      {FAROL_LABEL[row.farol]}
                    </span>
                  </TableCell>
                  <TableCell className="text-[13px]">{row.department_name ?? '—'}</TableCell>
                  <TableCell className="text-[13px] whitespace-nowrap">{row.code}</TableCell>
                  <TableCell className="text-[13px] text-ink-soft max-w-[240px] truncate" title={row.name}>
                    {row.name}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{numberFmt.format(row.percentage_progress)}%</TableCell>
                  <TableCell className="text-right tabular-nums text-ink-soft">{numberFmt.format(row.expected_progress)}%</TableCell>
                  <TableCell
                    className={cn(
                      'text-right tabular-nums font-medium',
                      row.deviation_pp < 0 ? 'text-danger' : 'text-success',
                    )}
                  >
                    {row.deviation_pp > 0 ? '+' : ''}{numberFmt.format(row.deviation_pp)}pp
                  </TableCell>
                  <TableCell className={cn('text-right tabular-nums text-[12px]', daysTone(row.days_to_deadline))}>
                    {formatDays(row.days_to_deadline)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </section>
    </div>
  )
}