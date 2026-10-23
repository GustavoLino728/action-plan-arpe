import { apiFetch } from './client'
import { API_ENDPOINTS } from './endpoints'
import { mapBackendTreeToPlanData, toBackendStatus } from './mappers'
import type {
  BackendActionPlanStepDTO,
  BackendDelayJustificationDTO,
  BackendInitiativeDTO,
  BackendKeyResultDTO,
  BackendStrategicObjectiveDTO,
  BackendStrategicPerspectiveDTO,
} from './dto'
import type { PlanData, Status } from '@/lib/types'

export async function fetchStrategicMapTree(): Promise<{
  data: PlanData
  treeRaw: BackendStrategicPerspectiveDTO[]
}> {
  const tree = await apiFetch<BackendStrategicPerspectiveDTO[]>(API_ENDPOINTS.strategicMap.tree)
  return mapBackendTreeToPlanData(tree)
}

// --- Payloads de Criação ---
export async function createPerspective(name: string): Promise<BackendStrategicPerspectiveDTO> {
  return apiFetch(API_ENDPOINTS.perspectives + '/', {
    method: 'POST',
    body: JSON.stringify({ name }),
  })
}

export async function createObjective(strategic_perspective_id: string, name: string): Promise<BackendStrategicObjectiveDTO> {
  return apiFetch(API_ENDPOINTS.objectives + '/', {
    method: 'POST',
    body: JSON.stringify({ strategic_perspective_id, name }),
  })
}

export async function createInitiative(payload: {
  strategic_objective_id: string
  responsible_sector: string
  name: string
  responsible_manager: string
  summary: string
  total_estimated_value?: string | null
  current_year_estimated_value?: string | null
}): Promise<BackendInitiativeDTO> {
  return apiFetch(API_ENDPOINTS.initiatives + '/', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function createKeyResult(payload: {
  initiative_id: string
  code: string
  name: string
  goal: string
}): Promise<BackendKeyResultDTO> {
  return apiFetch(API_ENDPOINTS.keyResults + '/', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function createStep(payload: {
  key_result_id: string
  sequential_number: number
  name: string
  planned_start_date: string
  planned_end_date: string
  actual_start_date?: string | null
  actual_end_date?: string | null
  responsible: string
  status: Status
}): Promise<BackendActionPlanStepDTO> {
  return apiFetch(API_ENDPOINTS.steps + '/', {
    method: 'POST',
    body: JSON.stringify({ ...payload, status: toBackendStatus(payload.status) }),
  })
}

export async function updateStepStatus(
  stepId: string,
  payload: { status: Status; actual_start_date?: string | null; actual_end_date?: string | null },
): Promise<BackendActionPlanStepDTO> {
  return apiFetch(`${API_ENDPOINTS.steps}/${stepId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ ...payload, status: toBackendStatus(payload.status) }),
  })
}

export async function createDelayJustification(payload: {
  step_id: string
  registration_date: string
  corrective_action: string
  responsible: string
  solution_forecast: string
  under_arpe_governance: boolean
  resolved?: boolean
}): Promise<BackendDelayJustificationDTO> {
  return apiFetch(API_ENDPOINTS.justifications + '/', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}