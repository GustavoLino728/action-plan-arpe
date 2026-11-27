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
  BackendAuditLogDTO,
  BackendStepCommentDTO,
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
  name: string
  responsible_manager: string
  summary: string
  total_estimated_value?: string | null
  current_year_estimated_value?: string | null
  department_id?: string | null
}): Promise<BackendInitiativeDTO> {
  return apiFetch<BackendInitiativeDTO>('/api/v1/initiatives/', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function createKeyResult(payload: {
  initiative_id: string
  code: string
  name: string
  goal: string
  planned_start_date?: string | null
  planned_end_date?: string | null
  actual_start_date?: string | null
  actual_end_date?: string | null
  responsible?: string | null
  status?: string | null
}): Promise<BackendKeyResultDTO> {
  return apiFetch<BackendKeyResultDTO>('/api/v1/key-results/', {
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

export interface ApiDepartment {
  id: string
  name: string
  acronym: string | null
  is_oversight: boolean
}

export async function fetchDepartments(): Promise<ApiDepartment[]> {
  return apiFetch<ApiDepartment[]>('/api/v1/departments/')
}

export async function createDepartment(payload: {
  name: string
  acronym?: string | null
  is_oversight?: boolean
}): Promise<ApiDepartment> {
  return apiFetch<ApiDepartment>('/api/v1/departments/', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function updateDepartment(
  id: string,
  payload: Partial<{ name: string; acronym: string | null; is_oversight: boolean }>,
): Promise<ApiDepartment> {
  return apiFetch<ApiDepartment>(`/api/v1/departments/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export async function deleteDepartment(id: string): Promise<void> {
  await apiFetch<void>(`/api/v1/departments/${id}`, { method: 'DELETE' })
}


export type UserRole = 'servidor' | 'coordenador' | 'diretor' | 'admin'

export interface ApiUser {
  id: string
  name: string
  email: string
  role: UserRole
  department_id: string | null
  department: ApiDepartment | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface ApiUserCreate {
  name: string
  email: string
  password: string
  role: UserRole
  department_id: string | null
}

export interface ApiUserUpdate {
  name?: string
  role?: UserRole
  is_active?: boolean
  department_id?: string | null
  password?: string
}

export async function fetchUsers(): Promise<ApiUser[]> {
  return apiFetch<ApiUser[]>('/api/v1/users')
}

export async function createUser(payload: ApiUserCreate): Promise<ApiUser> {
  return apiFetch<ApiUser>('/api/v1/users', {
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
    name: string
    responsible_manager: string
    summary: string
    total_estimated_value: string | null
    current_year_estimated_value: string | null
    department_id: string | null
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
  payload: Partial<{
    code: string
    name: string
    goal: string
    planned_start_date: string | null
    planned_end_date: string | null
    actual_start_date: string | null
    actual_end_date: string | null
    responsible: string | null
    status: string | null
  }>,
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

export async function fetchAuditLogs(
  entityType: string,
  entityId: string,
  limit = 100,
): Promise<BackendAuditLogDTO[]> {
  return apiFetch<BackendAuditLogDTO[]>(
    `/api/v1/audit-logs/?entity_type=${entityType}&entity_id=${entityId}&limit=${limit}`,
  )
}

export async function createComment(payload: {
  entity_type: string
  entity_id: string
  message: string
}): Promise<BackendAuditLogDTO> {
  return apiFetch<BackendAuditLogDTO>('/api/v1/audit-logs/comments', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function fetchStepComments(
  stepId: string,
): Promise<BackendStepCommentDTO[]> {
  return apiFetch<BackendStepCommentDTO[]>(`/api/v1/steps/${stepId}/comments`)
}

export async function createStepComment(
  stepId: string,
  message: string,
): Promise<BackendStepCommentDTO> {
  return apiFetch<BackendStepCommentDTO>(`/api/v1/steps/${stepId}/comments`, {
    method: 'POST',
    body: JSON.stringify({ message }),
  })
}

export async function deleteStepComment(
  stepId: string,
  commentId: string,
): Promise<void> {
  await apiFetch<void>(`/api/v1/steps/${stepId}/comments/${commentId}`, {
    method: 'DELETE',
  })
}