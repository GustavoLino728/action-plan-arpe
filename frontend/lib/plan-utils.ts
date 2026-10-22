import type { EtapaRow, Filters, Iniciativa, Justificativa, KR, Status } from './types'

// Data de referência fixa do protótipo, para que prazos e atrasos dos dados de exemplo sejam determinísticos.
export const REFERENCE_DATE = '2026-10-19'

export type Tone = 'success' | 'info' | 'warning' | 'danger' | 'muted' | 'gold'

export const TONE_CLASSES: Record<Tone, string> = {
  success: 'bg-success/10 text-success border-success/25',
  info: 'bg-info/10 text-info border-info/25',
  warning: 'bg-warning/10 text-warning border-warning/30',
  danger: 'bg-danger/10 text-danger border-danger/25',
  gold: 'bg-gold/15 text-foreground border-gold/40',
  muted: 'bg-muted text-muted-foreground border-border',
}

export const TONE_TEXT: Record<Tone, string> = {
  success: 'text-success',
  info: 'text-info',
  warning: 'text-warning',
  danger: 'text-danger',
  gold: 'text-foreground',
  muted: 'text-muted-foreground',
}

export const TONE_BAR: Record<Tone, string> = {
  success: 'bg-success',
  info: 'bg-info',
  warning: 'bg-warning',
  danger: 'bg-danger',
  gold: 'bg-gold',
  muted: 'bg-muted-foreground',
}

export const STATUS_ORDER: Status[] = ['concluido', 'em_andamento', 'a_iniciar', 'atrasado']

export const STATUS_META: Record<Status, { label: string; tone: Tone; color: string }> = {
  concluido: { label: 'Concluído', tone: 'success', color: 'var(--success)' },
  em_andamento: { label: 'Em Andamento', tone: 'info', color: 'var(--info)' },
  a_iniciar: { label: 'A Iniciar', tone: 'warning', color: 'var(--warning)' },
  atrasado: { label: 'Atrasado', tone: 'danger', color: 'var(--danger)' },
}

export function toDate(iso: string) {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d))
}

export function daysBetween(fromIso: string, toIso: string) {
  return Math.round((toDate(toIso).getTime() - toDate(fromIso).getTime()) / 86_400_000)
}

export function formatDate(iso: string) {
  if (!iso) return '—'
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

export function formatShortDate(iso: string) {
  if (!iso) return '—'
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y.slice(2)}`
}

export function formatValor(value: string) {
  const raw = value.trim()
  if (!raw) return 'A definir'
  const n = Number(raw.replace(/\./g, '').replace(',', '.').replace(/[^\d.-]/g, ''))
  if (/^[R$\s\d.,]+$/.test(raw) && Number.isFinite(n)) {
    return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  }
  return raw
}

type StatusLike = { status: Status; dataTermino: string }

export function effectiveStatus(e: StatusLike): Status {
  if (e.status === 'concluido') return 'concluido'
  if (e.status === 'atrasado') return 'atrasado'
  if (e.dataTermino && e.dataTermino < REFERENCE_DATE) return 'atrasado'
  return e.status
}

export function deadlineInfo(e: StatusLike): { label: string; tone: Tone } {
  if (e.status === 'concluido') return { label: 'Concluída', tone: 'success' }
  if (!e.dataTermino) return { label: 'Sem prazo', tone: 'muted' }
  const diff = daysBetween(REFERENCE_DATE, e.dataTermino)
  if (diff < 0) return { label: `Atrasada há ${Math.abs(diff)}d`, tone: 'danger' }
  if (e.status === 'atrasado') return { label: 'Atrasada', tone: 'danger' }
  if (diff === 0) return { label: 'Vence hoje', tone: 'warning' }
  if (diff <= 15) return { label: `Vence em ${diff}d`, tone: 'warning' }
  return { label: 'No prazo', tone: 'success' }
}

/** Percentual previsto linear entre início e término, usado quando a planilha não informa o previsto. */
export function expectedProgress(inicio: string, termino: string) {
  if (!inicio || !termino) return 0
  const total = daysBetween(inicio, termino)
  if (total <= 0) return REFERENCE_DATE >= termino ? 100 : 0
  const elapsed = daysBetween(inicio, REFERENCE_DATE)
  return Math.max(0, Math.min(100, Math.round((elapsed / total) * 100)))
}

export function normalize(text: string) {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

export function matchesQuery(e: EtapaRow, query: string) {
  const q = normalize(query)
  if (!q) return true
  return normalize(
    [
      e.iniciativa.strategic_perspective,
      e.iniciativa.objetivo,
      e.iniciativa.nome,
      e.iniciativa.setor,
      e.iniciativa.gestor,
      e.kr.nome,
      e.nome,
      e.responsavel,
    ].join(' | '),
  ).includes(q)
}

export function matchesFilters(e: EtapaRow, f: Filters) {
  if (f.strategic_perspective !== 'todas' && e.iniciativa.strategic_perspective !== f.strategic_perspective) return false
  if (f.setor !== 'todos' && e.iniciativa.setor !== f.setor) return false
  if (f.responsavel !== 'todos' && e.responsavel !== f.responsavel) return false
  if (f.status !== 'todos' && effectiveStatus(e) !== f.status) return false
  if (f.de && e.dataTermino < f.de) return false
  if (f.ate && e.dataTermino > f.ate) return false
  return true
}

export function averageProgress(etapas: { realizado: number }[]) {
  if (etapas.length === 0) return 0
  return Math.round(etapas.reduce((sum, e) => sum + e.realizado, 0) / etapas.length)
}

export function averagePlanned(etapas: { previsto: number }[]) {
  if (etapas.length === 0) return 0
  return Math.round(etapas.reduce((sum, e) => sum + e.previsto, 0) / etapas.length)
}

export function countByStatus(etapas: StatusLike[]): Record<Status, number> {
  const counts: Record<Status, number> = { concluido: 0, em_andamento: 0, a_iniciar: 0, atrasado: 0 }
  for (const e of etapas) counts[effectiveStatus(e)]++
  return counts
}

export interface KRNode {
  kr: KR
  etapas: EtapaRow[]
}
export interface IniciativaNode {
  iniciativa: Iniciativa
  krs: KRNode[]
  etapas: EtapaRow[]
}
export interface objetivoNode {
  nome: string
  iniciativas: IniciativaNode[]
  etapas: EtapaRow[]
}
export interface StrategicPerspectiveNode {
  nome: string
  objetivos: objetivoNode[]
  etapas: EtapaRow[]
}

export function buildIniciativaNodes(iniciativas: Iniciativa[], krs: KR[], rows: EtapaRow[]): IniciativaNode[] {
  return iniciativas.map((iniciativa) => {
    const krNodes = krs
      .filter((k) => k.iniciativaId === iniciativa.id)
      .map((kr) => ({ kr, etapas: rows.filter((r) => r.krId === kr.id).sort((a, b) => a.numero - b.numero) }))
    return { iniciativa, krs: krNodes, etapas: krNodes.flatMap((k) => k.etapas) }
  })
}

export function buildTree(iniciativas: Iniciativa[], krs: KR[], rows: EtapaRow[]): StrategicPerspectiveNode[] {
  const strategic_perspectives: StrategicPerspectiveNode[] = []
  for (const node of buildIniciativaNodes(iniciativas, krs, rows)) {
    const { iniciativa } = node
    let p = strategic_perspectives.find((x) => x.nome === iniciativa.strategic_perspective)
    if (!p) {
      p = { nome: iniciativa.strategic_perspective, objetivos: [], etapas: [] }
      strategic_perspectives.push(p)
    }
    let o = p.objetivos.find((x) => x.nome === iniciativa.objetivo)
    if (!o) {
      o = { nome: iniciativa.objetivo, iniciativas: [], etapas: [] }
      p.objetivos.push(o)
    }
    o.iniciativas.push(node)
    p.etapas.push(...node.etapas)
    o.etapas.push(...node.etapas)
  }
  return strategic_perspectives
}

export interface JustificativaSummary {
  total: number
  abertas: number
}

export function summarizeJustificativas(justificativas: Justificativa[]): Record<string, JustificativaSummary> {
  const map: Record<string, JustificativaSummary> = {}
  for (const j of justificativas) {
    const s = (map[j.etapaId] ??= { total: 0, abertas: 0 })
    s.total++
    if (!j.resolvido) s.abertas++
  }
  return map
}

export function unique(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)))
}

export function progressTone(percent: number): Tone {
  if (percent >= 100) return 'success'
  return 'info'
}

export function uid(prefix = 'id') {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}${Date.now().toString(36).slice(-3)}`
}
