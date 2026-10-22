'use client'

import { Bar, BarChart, CartesianGrid, Cell, Label, LabelList, Pie, PieChart, XAxis, YAxis } from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'
import { STATUS_META, STATUS_ORDER, averageProgress, countByStatus, unique } from '@/lib/plan-utils'
import type { Etapa, EtapaRow } from '@/lib/types'

const statusConfig = Object.fromEntries(STATUS_ORDER.map((s) => [s, { label: STATUS_META[s].label, color: STATUS_META[s].color }])) as ChartConfig

function truncate(text: string, max: number) {
  return text.length > max ? `${text.slice(0, max - 1)}…` : text
}

export function StatusDonut({ etapas }: { etapas: Etapa[] }) {
  const counts = countByStatus(etapas)
  const data = STATUS_ORDER.map((s) => ({ status: s, value: counts[s], fill: `var(--color-${s})` }))

  return (
    <Card>
      <CardHeader>
        <CardTitle>Distribuição por status</CardTitle>
        <CardDescription>Situação atual das {etapas.length} etapas do plano.</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={statusConfig} className="mx-auto aspect-square max-h-72">
          <PieChart>
            <ChartTooltip content={<ChartTooltipContent hideLabel nameKey="status" />} />
            <Pie data={data} dataKey="value" nameKey="status" innerRadius={62} strokeWidth={2}>
              {data.map((d) => (
                <Cell key={d.status} fill={d.fill} />
              ))}
              <Label
                content={({ viewBox }) => {
                  if (!viewBox || !('cx' in viewBox)) return null
                  return (
                    <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                      <tspan x={viewBox.cx} y={viewBox.cy} className="fill-foreground text-3xl font-semibold">
                        {averageProgress(etapas)}%
                      </tspan>
                      <tspan x={viewBox.cx} y={(viewBox.cy ?? 0) + 22} className="fill-muted-foreground text-xs">
                        média geral
                      </tspan>
                    </text>
                  )
                }}
              />
            </Pie>
            <ChartLegend content={<ChartLegendContent nameKey="status" className="flex-wrap [&>div]:whitespace-nowrap" />} />
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

const progressConfig = { progresso: { label: 'Progresso médio (%)', color: 'var(--chart-1)' } } satisfies ChartConfig

export function PerspectiveProgress({ rows }: { rows: EtapaRow[] }) {
  const data = unique(rows.map((r) => r.iniciativa.strategic_perspective)).map((nome) => ({
    nome,
    progresso: averageProgress(rows.filter((r) => r.iniciativa.strategic_perspective === nome)),
  }))

  return (
    <Card>
      <CardHeader>
        <CardTitle>Progresso por strategic_perspective</CardTitle>
        <CardDescription>Média de progresso das etapas em cada strategic_perspective estratégica.</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={progressConfig} className="h-64 w-full">
          <BarChart data={data} layout="vertical" margin={{ left: 0, right: 16 }}>
            <CartesianGrid horizontal={false} />
            <YAxis dataKey="nome" type="category" width={140} tickLine={false} axisLine={false} tickFormatter={(v: string) => truncate(v, 22)} />
            <XAxis type="number" domain={[0, 100]} tickFormatter={(v: number) => `${v}%`} tickLine={false} axisLine={false} />
            <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
            <Bar dataKey="progresso" fill="var(--color-progresso)" radius={4} barSize={28}>
              <LabelList dataKey="progresso" position="insideRight" formatter={(v: number) => `${v}%`} className="fill-white text-xs font-medium" />
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

export function ResponsibleLoad({ etapas }: { etapas: Etapa[] }) {
  const data = unique(etapas.map((e) => e.responsavel))
    .map((nome) => {
      const own = etapas.filter((e) => e.responsavel === nome)
      return { nome, ...countByStatus(own), total: own.length }
    })
    .sort((a, b) => b.total - a.total)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Etapas por responsável</CardTitle>
        <CardDescription>Volume de etapas de cada setor, separado por status.</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={statusConfig} className="w-full" style={{ height: Math.max(220, data.length * 44 + 60) }}>
          <BarChart data={data} layout="vertical" margin={{ left: 0, right: 16 }}>
            <CartesianGrid horizontal={false} />
            <YAxis dataKey="nome" type="category" width={90} tickLine={false} axisLine={false} tickFormatter={(v: string) => truncate(v, 12)} />
            <XAxis type="number" allowDecimals={false} tickLine={false} axisLine={false} />
            <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
            <ChartLegend content={<ChartLegendContent />} />
            {STATUS_ORDER.map((s) => (
              <Bar key={s} dataKey={s} stackId="a" fill={`var(--color-${s})`} />
            ))}
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
