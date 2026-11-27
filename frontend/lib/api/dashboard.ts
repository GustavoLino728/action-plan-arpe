import { apiFetch } from '@/lib/api/client'

export type Farol = 'verde' | 'amarelo' | 'vermelho'

export interface DashboardCards {
  total_krs: number
  verde: number
  amarelo: number
  vermelho: number
  sem_prazo: number
  krs_sem_movimento: number
  steps_atrasadas: number
}

export interface KrAlert {
  id: string
  code: string
  name: string
  initiative_name: string
  department_id: string | null
  department_name: string | null
  percentage_progress: number
  expected_progress: number
  deviation_pp: number
  days_to_deadline: number
  farol: Farol
}

export interface DashboardOverview {
  cards: DashboardCards
  krs_alerta: KrAlert[]
  scope: 'global' | 'department'
}

export async function fetchDashboardOverview(params?: {
  department_id?: string
  farol?: 'amarelo' | 'vermelho'
}): Promise<DashboardOverview> {
  const qs = new URLSearchParams()
  if (params?.department_id) qs.set('department_id', params.department_id)
  if (params?.farol) qs.set('farol', params.farol)
  const query = qs.toString()
  return apiFetch<DashboardOverview>(
    `/api/v1/dashboard/overview${query ? `?${query}` : ''}`,
  )
}