'use client'

import { DownloadIcon } from 'lucide-react'
import { CriticalSteps } from '@/components/critical-steps'
import { PageTitle } from '@/components/page-title'
import { usePlan } from '@/components/plan-provider'
import { PerspectiveProgress, ResponsibleLoad, StatusDonut } from '@/components/report-charts'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { STATUS_META, averageProgress, countByStatus, effectiveStatus, formatDate } from '@/lib/plan-utils'
import type { Etapa, EtapaRow } from '@/lib/types'

function csvCell(value: string | number) {
  return `"${String(value).replace(/"/g, '""')}"`
}

function exportCsv(rows: EtapaRow[]) {
  const header = ['StrategicPerspective', 'objetivo', 'Iniciativa', 'Etapa', 'Responsável', 'Início previsto', 'Término previsto', 'Status', 'Previsto (%)', 'Realizado (%)']
  const dataRows = rows.map((r) => [
    r.iniciativa.strategic_perspective,
    r.iniciativa.objetivo,
    r.iniciativa.nome,
    r.nome,
    r.responsavel,
    formatDate(r.dataInicio),
    formatDate(r.dataTermino),
    STATUS_META[effectiveStatus(r)].label,
    r.previsto,
    r.realizado,
  ])
  const csv = [header, ...dataRows].map((r) => r.map(csvCell).join(';')).join('\r\n')
  const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'relatorio-planejamento-estrategico.csv'
  a.click()
  URL.revokeObjectURL(url)
}

export function ReportView() {
  const { etapas, rows } = usePlan()
  const counts = countByStatus(etapas)
  const total = etapas.length

  const summary = [
    { label: 'Total de etapas', value: String(total) },
    { label: 'Progresso geral', value: `${averageProgress(etapas)}%` },
    { label: 'Concluídas', value: `${counts.concluido}`, hint: total ? `${Math.round((counts.concluido / total) * 100)}% do plano` : '' },
    { label: 'Em andamento', value: `${counts.em_andamento}` },
    { label: 'Atrasadas', value: `${counts.atrasado}`, hint: total ? `${Math.round((counts.atrasado / total) * 100)}% do plano` : '' },
  ]

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-5">
      <PageTitle
        title="Relatórios Executivos"
        description="Visão consolidada do andamento do planejamento estratégico para acompanhamento da diretoria."
        actions={
          <Button variant="outline" onClick={() => exportCsv(rows)} disabled={total === 0}>
            <DownloadIcon data-icon="inline-start" />
            Exportar CSV
          </Button>
        }
      />

      <section aria-label="Resumo" className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
        {summary.map((s) => (
          <Card key={s.label} size="sm">
            <CardContent className="flex flex-col gap-0.5">
              <span className="text-xs text-muted-foreground">{s.label}</span>
              <span className="text-2xl font-semibold tabular-nums">{s.value}</span>
              {s.hint && <span className="text-xs text-muted-foreground">{s.hint}</span>}
            </CardContent>
          </Card>
        ))}
      </section>

      <section aria-label="Gráficos" className="grid gap-4 lg:grid-cols-2">
        <StatusDonut etapas={etapas} />
        <PerspectiveProgress rows={rows} />
        <div className="lg:col-span-2">
          <ResponsibleLoad etapas={etapas} />
        </div>
      </section>

      <CriticalSteps etapas={rows} />
    </main>
  )
}
