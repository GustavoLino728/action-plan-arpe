import type { ImportRow } from '@/lib/import-utils'
import { toBackendStatus } from './mappers'

export interface BackendValidatedRowDTO {
  perspective: string
  objective: string
  responsible_sector: string
  initiative_name: string
  responsible_manager: string
  summary: string
  total_estimated_value: string | null
  current_year_estimated_value: string | null
  kr_code: string
  kr_name: string
  kr_goal: string
  sequential_number: number
  step_name: string
  planned_start_date: string
  planned_end_date: string
  actual_start_date: string | null
  actual_end_date: string | null
  responsible: string
  status: string
}

export function importRowToBackendPayload(row: ImportRow): BackendValidatedRowDTO {
  return {
    perspective: row.strategic_perspective,
    objective: row.objetivo,
    responsible_sector: row.setor,
    initiative_name: row.iniciativa,
    responsible_manager: row.gestor,
    summary: row.descricao,
    total_estimated_value: row.valorTotal || null,
    current_year_estimated_value: row.valor2026 || null,
    kr_code: row.kr,
    kr_name: row.kr,
    kr_goal: row.kr,
    sequential_number: row.numero ?? 1,
    step_name: row.etapa,
    planned_start_date: row.dataInicio,
    planned_end_date: row.dataTermino,
    actual_start_date: null,
    actual_end_date: null,
    responsible: row.responsavel,
    status: toBackendStatus(row.status),
  }
}