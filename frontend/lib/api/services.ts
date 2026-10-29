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

export interface ApiUser {
  id: string
  name: string
  email: string
  role: UserRole
  department: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface ApiUserCreate {
  name: string
  email: string
  password: string
  role: UserRole
  department: string | null
}

export interface ApiUserUpdate {
  name?: string
  role?: UserRole
  is_active?: boolean
  department?: string | null
  password?: string
}

export async function fetchUsers(): Promise<ApiUser[]> {
  return apiFetch<ApiUser[]>('/api/v1/users/')
}

export async function createUser(payload: ApiUserCreate): Promise<ApiUser> {
  return apiFetch<ApiUser>('/api/v1/users/', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function updateUser(id: string, payload: ApiUserUpdate): Promise<ApiUser> {
  return apiFetch<ApiUser>(`/api/v1/users/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export async function deleteUser(id: string): Promise<void> {
  await apiFetch<void>(`/api/v1/users/${id}`, { method: 'DELETE' })
}

export async function createDelayJustification(payload: {
  step_id: string
  registration_date: string
  corrective_action: string
  responsible: string
  solution_forecast: string
  under_arpe_governance: boolean
  resolved: boolean
}): Promise<BackendDelayJustificationDTO> {
  return apiFetch<BackendDelayJustificationDTO>('/api/v1/delay-justifications/', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function updateDelayJustification(
  id: string,
  payload: Partial<{
    registration_date: string
    corrective_action: string
    responsible: string
    solution_forecast: string
    under_arpe_governance: boolean
    resolved: boolean
  }>,
): Promise<BackendDelayJustificationDTO> {
  return apiFetch<BackendDelayJustificationDTO>(
    `/api/v1/delay-justifications/${id}`,
    {
      method: 'PATCH',
      body: JSON.stringify(payload),
    },
  )
}

export async function deleteDelayJustification(id: string): Promise<void> {
  await apiFetch<void>(`/api/v1/delay-justifications/${id}`, {
    method: 'DELETE',
  })
}

export async function updateInitiative(
  id: string,
  payload: Partial<{
    responsible_sector: string
    name: string
    responsible_manager: string
    summary: string
    total_estimated_value: string | null
    current_year_estimated_value: string | null
  }>,
): Promise<BackendInitiativeDTO> {
  return apiFetch<BackendInitiativeDTO>(`/api/v1/initiatives/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export async function deleteInitiative(id: string): Promise<void> {
  await apiFetch<void>(`/api/v1/initiatives/${id}`, { method: 'DELETE' })
}

export async function updateKeyResult(
  id: string,
  payload: Partial<{ code: string; name: string; goal: string }>,
): Promise<BackendKeyResultDTO> {
  return apiFetch<BackendKeyResultDTO>(`/api/v1/key-results/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export async function deleteKeyResult(id: string): Promise<void> {
  await apiFetch<void>(`/api/v1/key-results/${id}`, { method: 'DELETE' })
}

export async function updateStep(
  id: string,
  payload: Partial<{
    sequential_number: number
    name: string
    planned_start_date: string
    planned_end_date: string
    actual_start_date: string | null
    actual_end_date: string | null
    responsible: string
    status: string
  }>,
): Promise<BackendActionPlanStepDTO> {
  return apiFetch<BackendActionPlanStepDTO>(`/api/v1/steps/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export async function deleteStep(id: string): Promise<void> {
  await apiFetch<void>(`/api/v1/steps/${id}`, { method: 'DELETE' })
}