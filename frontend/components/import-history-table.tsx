'use client'

import {
  AlertTriangleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  Loader2Icon,
  RefreshCwIcon,
} from 'lucide-react'
import * as React from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/table'
import { Button } from '@/components/button'
import { cn } from '@/lib/utils'
import { apiFetch } from '@/lib/api/client'
import {
  fetchImportHistory,
  type ImportMode,
  type ImportUploadItem,
  type ImportUploadList,
} from '@/lib/api/import'


// ───────────── Helpers ─────────────

const dateTimeFmt = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

const numberFmt = new Intl.NumberFormat('pt-BR')

function formatDateTime(iso: string): string {
  return dateTimeFmt.format(new Date(iso))
}

function formatDuration(ms: number | null): string {
  if (ms == null) return '—'
  if (ms < 1000) return `${ms} ms`
  const s = ms / 1000
  if (s < 60) return `${s.toFixed(s < 10 ? 1 : 0)} s`
  const m = Math.floor(s / 60)
  const rem = Math.round(s % 60)
  return `${m}m ${rem}s`
}

const MODE_LABEL: Record<ImportMode, string> = {
  append: 'Adicionar',
  replace: 'Substituir',
}

type ModeFilter = 'all' | ImportMode

interface Props {
  className?: string
  /** Incrementar para forçar recarregamento (ex.: após um novo import). */
  reloadKey?: number
  pageSize?: number
}

// ───────────── Componente ─────────────

export function ImportHistoryTable({ className, reloadKey = 0, pageSize = 20 }: Props) {
  const [page, setPage] = React.useState(1)
  const [modeFilter, setModeFilter] = React.useState<ModeFilter>('all')
  const [data, setData] = React.useState<ImportUploadList | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [historyReloadKey, setHistoryReloadKey] = React.useState(0)

    const load = React.useCallback(async () => {
        setLoading(true)
        setError(null)
        try {
            const result = await fetchImportHistory({       // ← troca
            page,
            page_size: pageSize,
            mode: modeFilter !== 'all' ? modeFilter : undefined,
            })
            setData(result)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erro ao carregar histórico.')
        } finally {
            setLoading(false)
        }
    }, [page, pageSize, modeFilter])
  React.useEffect(() => {
    void load()
  }, [load, reloadKey])

  const total = data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const canPrev = page > 1
  const canNext = page < totalPages

  return (
    <section
      className={cn(
        'flex flex-col gap-4 bg-panel border border-line/30 rounded-custom p-5',
        className,
      )}
    >
      {/* Header + filtros */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-[14px] font-semibold text-ink">Histórico de importações</h2>
          <p className="text-[12px] text-ink-soft mt-0.5">
            {loading
              ? 'Carregando…'
              : `${numberFmt.format(total)} ${total === 1 ? 'registro' : 'registros'}`}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div
            role="radiogroup"
            aria-label="Filtrar por modo"
            className="inline-flex rounded-md border border-line bg-panel text-[12px]"
          >
            {(
              [
                { id: 'all', label: 'Todos' },
                { id: 'append', label: 'Adicionar' },
                { id: 'replace', label: 'Substituir' },
              ] as const
            ).map((opt, i) => (
              <button
                key={opt.id}
                type="button"
                role="radio"
                aria-checked={modeFilter === opt.id}
                onClick={() => {
                  setModeFilter(opt.id)
                  setPage(1)
                }}
                className={cn(
                  'px-3 py-1.5 transition-colors',
                  i > 0 && 'border-l border-line',
                  i === 0 && 'rounded-l-md',
                  i === 2 && 'rounded-r-md',
                  modeFilter === opt.id
                    ? 'bg-teal text-white'
                    : 'text-ink hover:bg-line/10',
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <Button
            variant="outline"
            onClick={() => void load()}
            disabled={loading}
            aria-label="Atualizar histórico"
          >
            {loading ? (
              <Loader2Icon className="size-4 animate-spin" />
            ) : (
              <RefreshCwIcon className="size-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Estado de erro */}
      {error && !loading && (
        <div className="flex items-start gap-2 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-[13px] text-rose-700">
          <AlertTriangleIcon className="size-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Tabela */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Quando</TableHead>
            <TableHead>Quem</TableHead>
            <TableHead>Arquivo</TableHead>
            <TableHead>Modo</TableHead>
            <TableHead className="text-right">Iniciativas</TableHead>
            <TableHead className="text-right">KRs</TableHead>
            <TableHead className="text-right">Etapas</TableHead>
            <TableHead className="text-right">Justificativas</TableHead>
            <TableHead className="text-right">Duração</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {loading && !data ? (
            Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={`skeleton-${i}`}>
                {Array.from({ length: 9 }).map((_, j) => (
                  <TableCell key={j}>
                    <div className="h-3 w-full max-w-[120px] rounded bg-line/40 animate-pulse" />
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : data && data.items.length === 0 ? (
            <TableRow>
              <TableCell colSpan={9} className="py-8 text-center text-[13px] text-ink-soft">
                Nenhuma importação registrada
                {modeFilter !== 'all' ? ` no modo "${MODE_LABEL[modeFilter]}"` : ''}.
              </TableCell>
            </TableRow>
          ) : (
            data?.items.map((row) => (
              <TableRow key={row.id}>
                <TableCell className="whitespace-nowrap text-[12px] text-ink-soft">
                  {formatDateTime(row.created_at)}
                </TableCell>
                <TableCell className="text-[13px]">
                  <span className="truncate">{row.user_name}</span>
                </TableCell>
                <TableCell className="max-w-[220px]">
                  <span className="block truncate text-[13px] text-ink-soft" title={row.source_file_name ?? undefined}>
                    {row.source_file_name ?? '—'}
                  </span>
                </TableCell>
                <TableCell>
                  <ModeBadge mode={row.mode} />
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {numberFmt.format(row.initiatives_created)}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {numberFmt.format(row.key_results_created)}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  <span>{numberFmt.format(row.steps_upserted)}</span>
                  {row.steps_deleted > 0 && (
                    <span className="ml-1 text-[11px] text-rose-600">
                      (−{numberFmt.format(row.steps_deleted)})
                    </span>
                  )}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {numberFmt.format(row.justificativas_upserted)}
                </TableCell>
                <TableCell className="text-right tabular-nums text-[12px] text-ink-soft">
                  {formatDuration(row.duration_ms)}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {/* Paginação */}
      {total > 0 && (
        <div className="flex items-center justify-between text-[12px] text-ink-soft">
          <span>
            Página {page} de {totalPages}
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={!canPrev || loading}
              aria-label="Página anterior"
            >
              <ChevronLeftIcon className="size-4" />
            </Button>
            <Button
              variant="outline"
              onClick={() => setPage((p) => p + 1)}
              disabled={!canNext || loading}
              aria-label="Próxima página"
            >
              <ChevronRightIcon className="size-4" />
            </Button>
          </div>
        </div>
      )}
    </section>
  )
}

function ModeBadge({ mode }: { mode: ImportMode }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium',
        mode === 'append'
          ? 'border-info/30 bg-info/10 text-info'
          : 'border-warning/40 bg-warning/15 text-warning',
      )}
    >
      {MODE_LABEL[mode]}
    </span>
  )
}