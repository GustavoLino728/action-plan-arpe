// Mapa de chaves do backend → labels em português
export const FIELD_LABELS: Record<string, string> = {
  // ActionPlanStep
  sequential_number: 'Nº sequencial',
  name: 'Nome',
  planned_start_date: 'Início previsto',
  planned_end_date: 'Término previsto',
  actual_start_date: 'Início realizado',
  actual_end_date: 'Término realizado',
  responsible: 'Responsável',
  status: 'Status',
  // KeyResult
  code: 'Código',
  goal: 'Meta',
  percentage_progress: 'Progresso',
  // StrategicInitiative
  responsible_sector: 'Setor responsável',
  responsible_manager: 'Gestor responsável',
  summary: 'Descrição',
  total_estimated_value: 'Valor total estimado',
  current_year_estimated_value: 'Valor estimado 2026',
}

// Status vêm do backend como "NOT_STARTED", "IN_PROGRESS", etc.
export const STATUS_LABELS: Record<string, string> = {
  NOT_STARTED: 'A Iniciar',
  IN_PROGRESS: 'Em Andamento',
  COMPLETED: 'Concluído',
  DELAYED: 'Atrasado',
  // fallback em pt-BR (caso algum valor já chegue traduzido)
  a_iniciar: 'A Iniciar',
  em_andamento: 'Em Andamento',
  concluido: 'Concluído',
  atrasado: 'Atrasado',
}

export function fieldLabel(key: string): string {
  return FIELD_LABELS[key] ?? key
}

export function formatChangeValue(field: string, value: unknown): string {
  if (value === null || value === undefined || value === '') return '—'

  // Status tem dicionário próprio
  if (field === 'status' && typeof value === 'string') {
    return STATUS_LABELS[value] ?? value
  }

  // Datas em ISO → DD/MM/YYYY
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [y, m, d] = value.split('-')
    return `${d}/${m}/${y}`
  }

  // Booleanos
  if (typeof value === 'boolean') return value ? 'Sim' : 'Não'

  return String(value)
}