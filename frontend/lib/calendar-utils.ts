import type { Etapa, Iniciativa, KR, Status } from '@/lib/types'

// ─── Tipos ───
export type CalendarLayer = 'geral' | 'kr' | 'etapa'

export type CalendarEvent = {
  id: string
  layer: CalendarLayer
  title: string
  subtitle: string
  start: string   // YYYY-MM-DD
  end: string
  status: Status
  initiativeId: string
  initiativeName: string
  departmentId: string | null
  perspective: string
  responsible: string
  krId?: string
  stepId?: string
}

export type CalendarFiltersState = {
  layers: Set<CalendarLayer>
  departmentId: string | 'todos'
  perspective: string | 'todas'
  status: Status | 'todos'
  responsible: string | 'todos'
}

// ─── Datas ───
export function toISODate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function parseISODate(s: string): Date {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

export function isToday(d: Date): boolean {
  return isSameDay(d, new Date())
}

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

export function formatMonthYear(year: number, month: number): string {
  return `${MONTH_NAMES[month]} ${year}`
}

export const WEEKDAY_LABELS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']

/**
 * Retorna 6 semanas × 7 dias (começando segunda).
 * Dias fora do mês ainda aparecem (com opacity baixa).
 */
export function getMonthMatrix(year: number, month: number): Date[][] {
  const first = new Date(year, month, 1)
  const firstWeekday = (first.getDay() + 6) % 7 // segunda=0
  const start = new Date(year, month, 1 - firstWeekday)
  const weeks: Date[][] = []
  for (let w = 0; w < 6; w++) {
    const week: Date[] = []
    for (let d = 0; d < 7; d++) {
      week.push(new Date(start.getFullYear(), start.getMonth(), start.getDate() + w * 7 + d))
    }
    weeks.push(week)
  }
  return weeks
}

// ─── Build de eventos ───
export function buildCalendarEvents(
  iniciativas: Iniciativa[],
  krs: KR[],
  etapas: Etapa[],
): CalendarEvent[] {
  const krById = new Map(krs.map((k) => [k.id, k]))
  const iniById = new Map(iniciativas.map((i) => [i.id, i]))

  const stepEvents: CalendarEvent[] = []
  const geralEnvelopes = new Map<string, { start: string; end: string; ini: Iniciativa }>()

  // Mapear etapa → KR → iniciativa
  for (const etapa of etapas) {
    const kr = krById.get(etapa.krId)
    if (!kr) continue
    const ini = iniById.get(kr.iniciativaId)
    if (!ini) continue

    stepEvents.push({
      id: `step:${etapa.id}`,
      layer: 'etapa',
      title: etapa.nome,
      subtitle: `${ini.nome} · ${kr.nome}`,
      start: etapa.dataInicio,
      end: etapa.dataTermino,
      status: etapa.status,
      initiativeId: ini.id,
      initiativeName: ini.nome,
      departmentId: ini.departmentId,
      perspective: ini.strategic_perspective,
      responsible: etapa.responsavel,
      krId: kr.id,
      stepId: etapa.id,
    })

    // Envelope "geral": junta KR + etapa
    const cur = geralEnvelopes.get(ini.id)
    if (!cur) {
      geralEnvelopes.set(ini.id, { start: etapa.dataInicio, end: etapa.dataTermino, ini })
    } else {
      if (etapa.dataInicio < cur.start) cur.start = etapa.dataInicio
      if (etapa.dataTermino > cur.end) cur.end = etapa.dataTermino
    }
  }

  const krEvents: CalendarEvent[] = []
  for (const kr of krs) {
    if (!kr.dataInicio || !kr.dataTermino) continue
    const ini = iniById.get(kr.iniciativaId)
    if (!ini) continue

    krEvents.push({
      id: `kr:${kr.id}`,
      layer: 'kr',
      title: kr.nome,
      subtitle: ini.nome,
      start: kr.dataInicio,
      end: kr.dataTermino,
      status: kr.status ?? 'a_iniciar',
      initiativeId: ini.id,
      initiativeName: ini.nome,
      departmentId: ini.departmentId,
      perspective: ini.strategic_perspective,
      responsible: kr.responsavel ?? '',
      krId: kr.id,
    })

    const cur = geralEnvelopes.get(ini.id)
    if (!cur) {
      geralEnvelopes.set(ini.id, { start: kr.dataInicio, end: kr.dataTermino, ini })
    } else {
      if (kr.dataInicio < cur.start) cur.start = kr.dataInicio
      if (kr.dataTermino > cur.end) cur.end = kr.dataTermino
    }
  }

  const geralEvents: CalendarEvent[] = Array.from(geralEnvelopes.values()).map(
    ({ start, end, ini }) => ({
      id: `geral:${ini.id}`,
      layer: 'geral',
      title: ini.nome,
      subtitle: ini.strategic_perspective,
      start,
      end,
      status: 'em_andamento',
      initiativeId: ini.id,
      initiativeName: ini.nome,
      departmentId: ini.departmentId,
      perspective: ini.strategic_perspective,
      responsible: ini.gestor,
    }),
  )

  return [...geralEvents, ...krEvents, ...stepEvents]
}

// ─── Filtros ───
export function applyCalendarFilters(
  events: CalendarEvent[],
  f: CalendarFiltersState,
): CalendarEvent[] {
  return events.filter((e) => {
    if (!f.layers.has(e.layer)) return false
    if (f.departmentId !== 'todos' && e.departmentId !== f.departmentId) return false
    if (f.perspective !== 'todas' && e.perspective !== f.perspective) return false
    if (f.status !== 'todos' && e.status !== f.status) return false
    if (f.responsible !== 'todos' && e.responsible !== f.responsible) return false
    return true
  })
}

// ─── Helpers de render ───
export function eventsForDay(events: CalendarEvent[], date: Date): CalendarEvent[] {
  const iso = toISODate(date)
  return events.filter((e) => e.end === iso)
}

export function formatDayLong(d: Date): string {
  const weekdays = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']
  return `${weekdays[d.getDay()]}, ${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`
}